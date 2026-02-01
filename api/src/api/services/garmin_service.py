from starlette.authentication import AuthenticationError
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any, cast

from garth import login
from garth import Client
from garth.auth_tokens import OAuth1Token, OAuth2Token

from db.client import DB
from api.utils.crypto import CryptoManager

class GarminService:
    """Service for Garmin API interactions: authentication, token management, and data syncing."""
    
    def __init__(self, db: DB, crypto_manager: CryptoManager):
        self.db = db
        self.crypto_manager = crypto_manager

    # ==================== AUTHENTICATION ====================
    
    async def authenticate(self, email: str, password: str) -> tuple[OAuth1Token, OAuth2Token]:
        """
        Authenticate with Garmin using email/password.
        
        Args:
            email: Garmin account email
            password: Garmin account password
            
        Returns:
            Tuple of (OAuth1Token, OAuth2Token)
            
        Raises:
            Exception: If Garmin authentication fails
        """
        oauth1, oauth2 = login(email, password)
        return oauth1, oauth2

    async def store_tokens(self, user_id: int, oauth1: OAuth1Token | None = None, oauth2: OAuth2Token | None = None) -> bool:
        """
        Store OAuth tokens for a user (initial insert or update).
        Encrypts sensitive data before storage.
        Allows storing only available tokens (OAuth1 or OAuth2 or both).
        
        Args:
            user_id: User ID to associate tokens with
            oauth1: Optional OAuth1Token from Garmin
            oauth2: Optional OAuth2Token from Garmin
            
        Returns:
            True if successful, False otherwise
            
        Raises:
            ValueError: If neither oauth1 nor oauth2 provided
        """
        if not oauth1 and not oauth2:
            raise ValueError("At least one token type (oauth1 or oauth2) must be provided")
        
        # Encrypt tokens if provided
        encrypted_oauth1_token = None
        encrypted_oauth1_token_secret = None
        encrypted_oauth2_access_token = None
        encrypted_oauth2_refresh_token = None
        
        if oauth1:
            encrypted_oauth1_token = self.crypto_manager.encrypt(oauth1.oauth_token)
            encrypted_oauth1_token_secret = self.crypto_manager.encrypt(oauth1.oauth_token_secret)
        
        if oauth2:
            encrypted_oauth2_access_token = self.crypto_manager.encrypt(oauth2.access_token)
            encrypted_oauth2_refresh_token = self.crypto_manager.encrypt(oauth2.refresh_token)
        
        # Check if tokens already exist for this user
        check_query = "SELECT user_id FROM oauth_tokens WHERE user_id = ?"
        result = await self.db.execute(check_query, args=(user_id,))
        
        if result.rows:
            # Update existing tokens - only update fields that have new values
            update_parts = ["updated_at = ?"]
            update_args = [datetime.now()]
            
            if oauth1:
                update_parts.extend([
                    "oauth1_token = ?",
                    "oauth1_token_secret = ?",
                    "oauth1_mfa_token = ?",
                    "oauth1_mfa_expiration_timestamp = ?",
                    "oauth1_domain = ?"
                ])
                update_args.extend([
                    encrypted_oauth1_token,
                    encrypted_oauth1_token_secret,
                    oauth1.mfa_token,
                    oauth1.mfa_expiration_timestamp,
                    oauth1.domain
                ])
            
            if oauth2:
                update_parts.extend([
                    "oauth2_access_token = ?",
                    "oauth2_refresh_token = ?",
                    "oauth2_expires_in = ?",
                    "oauth2_expires_at = ?",
                    "oauth2_refresh_token_expires_in = ?",
                    "oauth2_refresh_token_expires_at = ?",
                    "oauth2_token_type = ?",
                    "oauth2_scope = ?",
                    "oauth2_jti = ?"
                ])
                update_args.extend([
                    encrypted_oauth2_access_token,
                    encrypted_oauth2_refresh_token,
                    oauth2.expires_in,
                    oauth2.expires_at,
                    oauth2.refresh_token_expires_in,
                    oauth2.refresh_token_expires_at,
                    oauth2.token_type,
                    oauth2.scope,
                    oauth2.jti
                ])
            
            update_args.append(user_id)
            
            query = f"UPDATE oauth_tokens SET {', '.join(update_parts)} WHERE user_id = ?"
            await self.db.execute(query, args=tuple(update_args))
        else:
            columns = ["user_id", "created_at", "updated_at"]
            values = [user_id, datetime.now(), datetime.now()]
            placeholders = ["?", "?", "?"]
            
            if oauth1:
                columns.extend([
                    "oauth1_token", "oauth1_token_secret", "oauth1_mfa_token",
                    "oauth1_mfa_expiration_timestamp", "oauth1_domain"
                ])
                values.extend([
                    encrypted_oauth1_token,
                    encrypted_oauth1_token_secret,
                    oauth1.mfa_token,
                    oauth1.mfa_expiration_timestamp,
                    oauth1.domain
                ])
                placeholders.extend(["?"] * 5)
            
            if oauth2:
                columns.extend([
                    "oauth2_access_token", "oauth2_refresh_token", "oauth2_expires_in",
                    "oauth2_expires_at", "oauth2_refresh_token_expires_in",
                    "oauth2_refresh_token_expires_at", "oauth2_token_type",
                    "oauth2_scope", "oauth2_jti"
                ])
                values.extend([
                    encrypted_oauth2_access_token,
                    encrypted_oauth2_refresh_token,
                    oauth2.expires_in,
                    oauth2.expires_at,
                    oauth2.refresh_token_expires_in,
                    oauth2.refresh_token_expires_at,
                    oauth2.token_type,
                    oauth2.scope,
                    oauth2.jti
                ])
                placeholders.extend(["?"] * 9)
            
            query = f"INSERT INTO oauth_tokens ({', '.join(columns)}) VALUES ({', '.join(placeholders)})"
            await self.db.execute(query, args=tuple(values))
        
        return True

    async def load_client(self, user_id: int) -> Client | None:
        """
        Load a configured Garmin client for a user.
        Decrypts stored tokens and configures the client.
        
        Args:
            user_id: User ID to load tokens for
            
        Returns:
            Configured Client instance or None if tokens don't exist
            
        Raises:
            ValueError: If token decryption fails
        """
        query = """
            SELECT oauth1_token, oauth1_token_secret, oauth1_mfa_token,
                   oauth1_mfa_expiration_timestamp, oauth1_domain,
                   oauth2_access_token, oauth2_refresh_token, oauth2_expires_in,
                   oauth2_expires_at, oauth2_refresh_token_expires_in,
                   oauth2_refresh_token_expires_at, oauth2_token_type,
                   oauth2_scope, oauth2_jti
            FROM oauth_tokens WHERE user_id = ?
        """
        result = await self.db.execute(query, args=(user_id,))
        if not result.rows:
            return None

        row = result.rows[0]
        
        if not row["oauth1_token"] or not row["oauth1_token_secret"]:
            return None

        # Decrypt the encrypted tokens
        try:
            oauth1_token = self.crypto_manager.decrypt(row["oauth1_token"])
            oauth1_token_secret = self.crypto_manager.decrypt(row["oauth1_token_secret"])
            oauth2_access_token = self.crypto_manager.decrypt(row["oauth2_access_token"])
            oauth2_refresh_token = self.crypto_manager.decrypt(row["oauth2_refresh_token"])
        except ValueError as e:
            raise ValueError(f"Failed to decrypt tokens for user {user_id}: {e}")

        oauth1 = OAuth1Token(
            oauth_token=oauth1_token,
            oauth_token_secret=oauth1_token_secret,
            mfa_token=row["oauth1_mfa_token"],
            mfa_expiration_timestamp=row["oauth1_mfa_expiration_timestamp"],
            domain=row["oauth1_domain"]
        )

        oauth2 = OAuth2Token(
            access_token=oauth2_access_token,
            refresh_token=oauth2_refresh_token,
            expires_in=row["oauth2_expires_in"],
            expires_at=row["oauth2_expires_at"],
            refresh_token_expires_in=row["oauth2_refresh_token_expires_in"],
            refresh_token_expires_at=row["oauth2_refresh_token_expires_at"],
            token_type=row["oauth2_token_type"],
            scope=row["oauth2_scope"],
            jti=row["oauth2_jti"]
        )

        client = Client()
        client.configure(oauth1_token=oauth1, oauth2_token=oauth2)

        return client

    async def refresh_tokens_if_needed(self, user_id: int, client: Client) -> bool:
        """
        Check if tokens are expired and refresh them if needed.
        
        Args:
            user_id: User ID associated with tokens
            client: Configured Garmin client
            
        Returns:
            True if tokens were refreshed or valid, False otherwise
        """
        if client.oauth2_token and client.oauth2_token.expired:
            try:
                client.refresh_oauth2()
                oauth1 = client.oauth1_token
                oauth2 = client.oauth2_token
                if isinstance(oauth1, str) and oauth1 == 'needs_mfa':
                    raise AuthenticationError("MFA required to refresh OAuth1 token")
                
                if not oauth1 or not oauth2:
                    raise ValueError("Failed to refresh tokens: Missing tokens after refresh")

                await self.store_tokens(user_id, oauth1=oauth1, oauth2=oauth2)
                return True
            except Exception as e:
                raise ValueError(f"Failed to refresh tokens for user {user_id}: {e}")
        
        return True

    async def get_client_for_user(self, user_id: int) -> Client:
        """
        Get a configured and refreshed Garmin client for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Configured Client with valid tokens
            
        Raises:
            ValueError: If no tokens found or decryption fails
        """
        client = await self.load_client(user_id)
        if not client:
            raise ValueError(f"No Garmin tokens found for user {user_id}")
        
        await self.refresh_tokens_if_needed(user_id, client)
        return client

    
    async def _get_last_sync_time(self, user_id: int, sync_type: str) -> datetime | None:
        """Get the last successful sync time for a user and data type."""
        query = """
            SELECT last_sync_at FROM sync_history 
            WHERE user_id = ? AND sync_type = ? AND status = 'success'
            ORDER BY last_sync_at DESC LIMIT 1
        """
        result = await self.db.execute(query, args=(user_id, sync_type))
        if result.rows:
            return result.rows[0]["last_sync_at"]
        return None
    
    async def _record_sync(self, user_id: int, sync_type: str, status: str, items_synced: int = 0, error: str | None = None):
        """Record a sync attempt in history."""
        query = """
            INSERT INTO sync_history (user_id, sync_type, status, items_synced, error, last_sync_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """
        await self.db.execute(query, args=(
            user_id, sync_type, status, items_synced, error, datetime.now()
        ))
    
    async def sync_activities(self, user_id: int, start_date: datetime | None = None, end_date: datetime | None = None) -> int:
        """
        Sync activities from Garmin to local database.
        
        Args:
            user_id: User ID
            start_date: Optional start date (defaults to last sync or 30 days ago)
            end_date: Optional end date (defaults to now)
            
        Returns:
            Number of activities synced
        """
        client = await self.get_client_for_user(user_id)
        
        # Determine date range
        if not start_date:
            last_sync = await self._get_last_sync_time(user_id, 'activities')
            start_date = last_sync or (datetime.now() - timedelta(days=30))
        
        if not end_date:
            end_date = datetime.now()
        
        try:
            activities = client.connectapi(
                f"/activitylist-service/activities/search/activities"
                f"?start=0&limit=100"
            )
            
            items_synced = 0
            for activity in activities:
                check_query = "SELECT activity_id FROM activities WHERE garmin_activity_id = ? AND user_id = ?"
                result = await self.db.execute(check_query, args=(activity.get('activityId'), user_id))
                
                if not result.rows:
                    # Insert new activity
                    insert_query = """
                        INSERT INTO activities (
                            user_id, garmin_activity_id, activity_type, date, 
                            duration, distance, calories, avg_hr, max_hr
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """
                    await self.db.execute(insert_query, args=(
                        user_id,
                        activity.get('activityId'),
                        activity.get('activityType', {}).get('typeKey'),
                        activity.get('startTimeLocal'),
                        activity.get('duration'),
                        activity.get('distance'),
                        activity.get('calories'),
                        activity.get('averageHR'),
                        activity.get('maxHR')
                    ))
                    items_synced += 1
            
            await self._record_sync(user_id, 'activities', 'success', items_synced)
            return items_synced
            
        except Exception as e:
            await self._record_sync(user_id, 'activities', 'error', 0, str(e))
            raise ValueError(f"Failed to sync activities: {e}")
    
    async def sync_vitals(self, user_id: int, date: datetime | None = None) -> int:
        """
        Sync health vitals from Garmin to local database.
        
        Args:
            user_id: User ID
            date: Optional specific date (defaults to today)
            
        Returns:
            Number of vitals records synced
        """
        client = await self.get_client_for_user(user_id)
        
        if not date:
            date = datetime.now()
        
        date_str = date.strftime('%Y-%m-%d')
        
        try:
            # Fetch various health metrics
            sleep_data = client.connectapi(f"/wellness-service/wellness/dailySleep/{date_str}")
            hrv_data = client.connectapi(f"/hrv-service/hrv/{date_str}")
            stress_data = client.connectapi(f"/wellness-service/wellness/dailyStress/{date_str}")
            
            # Check if vitals already exist for this date
            check_query = "SELECT vital_id FROM vitals WHERE user_id = ? AND date = ?"
            result = await self.db.execute(check_query, args=(user_id, date_str))
            
            if result.rows:
                # Update existing vitals
                update_query = """
                    UPDATE vitals SET 
                        sleep_score = ?,
                        sleeping_hr = ?,
                        hrv = ?,
                        stress = ?,
                        updated_at = ?
                    WHERE user_id = ? AND date = ?
                """
                await self.db.execute(update_query, args=(
                    sleep_data.get('sleepScore'),
                    sleep_data.get('sleepingHeartRate'),
                    hrv_data.get('lastNightAvg'),
                    stress_data.get('avgStressLevel'),
                    datetime.now(),
                    user_id,
                    date_str
                ))
            else:
                # Insert new vitals
                insert_query = """
                    INSERT INTO vitals (
                        user_id, date, sleep_score, sleeping_hr, hrv, stress
                    ) VALUES (?, ?, ?, ?, ?, ?)
                """
                await self.db.execute(insert_query, args=(
                    user_id,
                    date_str,
                    sleep_data.get('sleepScore'),
                    sleep_data.get('sleepingHeartRate'),
                    hrv_data.get('lastNightAvg'),
                    stress_data.get('avgStressLevel')
                ))
            
            await self._record_sync(user_id, 'vitals', 'success', 1)
            return 1
            
        except Exception as e:
            await self._record_sync(user_id, 'vitals', 'error', 0, str(e))
            raise ValueError(f"Failed to sync vitals: {e}")
    
    async def sync_all(self, user_id: int) -> Dict[str, int]:
        """
        Sync all data types from Garmin.
        
        Args:
            user_id: User ID
            
        Returns:
            Dictionary with counts of synced items per type
        """
        results = {}
        
        try:
            results['activities'] = await self.sync_activities(user_id)
        except Exception as e:
            results['activities'] = f"Error: {str(e)}"
        
        try:
            results['vitals'] = await self.sync_vitals(user_id)
        except Exception as e:
            results['vitals'] = f"Error: {str(e)}"
        
        return results

