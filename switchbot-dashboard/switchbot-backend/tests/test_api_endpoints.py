import time
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

import app.main as main_module
from app.main import (
    MeterDevice,
    MeterReading,
    TimeScale,
    app,
    data_store,
    init_database,
    save_reading_to_db,
)


@pytest.fixture
def client(reset_data_store) -> TestClient:
    return TestClient(app)


class TestHealthzEndpoint:
    def test_healthz_returns_ok(self, client):
        response = client.get("/healthz")
        
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


class TestGetMetersEndpoint:
    def test_get_meters_empty(self, client):
        response = client.get("/api/meters")
        
        assert response.status_code == 200
        data = response.json()
        assert data["meters"] == []
        assert data["last_updated"] is None

    def test_get_meters_with_devices(self, client, reset_data_store):
        now = datetime.now(timezone.utc)
        data_store.devices["device-001"] = MeterDevice(
            device_id="device-001",
            device_name="Test Meter",
            device_type="Meter",
            current_temperature=25.5,
            current_humidity=60,
            battery=85,
            last_updated=now,
        )
        
        response = client.get("/api/meters")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["meters"]) == 1
        assert data["meters"][0]["device_id"] == "device-001"
        assert data["meters"][0]["device_name"] == "Test Meter"
        assert data["meters"][0]["current_temperature"] == 25.5

    def test_get_meters_multiple_devices(self, client, reset_data_store):
        now = datetime.now(timezone.utc)
        data_store.devices["device-001"] = MeterDevice(
            device_id="device-001",
            device_name="Meter 1",
            device_type="Meter",
            last_updated=now,
        )
        data_store.devices["device-002"] = MeterDevice(
            device_id="device-002",
            device_name="Meter 2",
            device_type="MeterPlus",
            last_updated=now - timedelta(hours=1),
        )
        
        response = client.get("/api/meters")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["meters"]) == 2


class TestGetMeterHistoryEndpoint:
    def test_get_meter_history_not_found(self, client):
        response = client.get("/api/meters/nonexistent-device/history")
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    async def test_get_meter_history_hour_scale(self, client, reset_data_store, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            now = datetime.now(timezone.utc)
            data_store.devices["device-001"] = MeterDevice(
                device_id="device-001",
                device_name="Test Meter",
                device_type="Meter",
            )
            
            for i in range(5):
                reading = MeterReading(
                    timestamp=now - timedelta(minutes=i * 10),
                    temperature=25.0 + i,
                    humidity=60,
                )
                await save_reading_to_db("device-001", reading)
            
            response = client.get("/api/meters/device-001/history?time_scale=hour")
            
            assert response.status_code == 200
            data = response.json()
            assert data["device_id"] == "device-001"
            assert data["time_scale"] == "hour"
            assert len(data["history"]) == 5
        finally:
            main_module.DB_PATH = original_db_path

    async def test_get_meter_history_day_scale(self, client, reset_data_store, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            now = datetime.now(timezone.utc)
            data_store.devices["device-001"] = MeterDevice(
                device_id="device-001",
                device_name="Test Meter",
                device_type="Meter",
            )
            
            for i in range(10):
                reading = MeterReading(
                    timestamp=now - timedelta(hours=i * 2),
                    temperature=25.0 + i,
                    humidity=60,
                )
                await save_reading_to_db("device-001", reading)
            
            response = client.get("/api/meters/device-001/history?time_scale=day")
            
            assert response.status_code == 200
            data = response.json()
            assert data["time_scale"] == "day"
        finally:
            main_module.DB_PATH = original_db_path

    async def test_get_meter_history_week_scale(self, client, reset_data_store, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            now = datetime.now(timezone.utc)
            data_store.devices["device-001"] = MeterDevice(
                device_id="device-001",
                device_name="Test Meter",
                device_type="Meter",
            )
            
            for i in range(7):
                reading = MeterReading(
                    timestamp=now - timedelta(days=i),
                    temperature=25.0 + i,
                    humidity=60,
                )
                await save_reading_to_db("device-001", reading)
            
            response = client.get("/api/meters/device-001/history?time_scale=week")
            
            assert response.status_code == 200
            data = response.json()
            assert data["time_scale"] == "week"
            assert len(data["history"]) == 7
        finally:
            main_module.DB_PATH = original_db_path

    async def test_get_meter_history_month_scale(self, client, reset_data_store, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            now = datetime.now(timezone.utc)
            data_store.devices["device-001"] = MeterDevice(
                device_id="device-001",
                device_name="Test Meter",
                device_type="Meter",
            )
            
            for i in range(30):
                reading = MeterReading(
                    timestamp=now - timedelta(days=i),
                    temperature=25.0,
                    humidity=60,
                )
                await save_reading_to_db("device-001", reading)
            
            response = client.get("/api/meters/device-001/history?time_scale=month")
            
            assert response.status_code == 200
            data = response.json()
            assert data["time_scale"] == "month"
        finally:
            main_module.DB_PATH = original_db_path

    async def test_get_meter_history_year_scale(self, client, reset_data_store, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            now = datetime.now(timezone.utc)
            data_store.devices["device-001"] = MeterDevice(
                device_id="device-001",
                device_name="Test Meter",
                device_type="Meter",
            )
            
            for i in range(12):
                reading = MeterReading(
                    timestamp=now - timedelta(days=i * 30),
                    temperature=25.0,
                    humidity=60,
                )
                await save_reading_to_db("device-001", reading)
            
            response = client.get("/api/meters/device-001/history?time_scale=year")
            
            assert response.status_code == 200
            data = response.json()
            assert data["time_scale"] == "year"
        finally:
            main_module.DB_PATH = original_db_path

    async def test_get_meter_history_returns_device_info(self, client, reset_data_store, temp_db_path):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            data_store.devices["device-001"] = MeterDevice(
                device_id="device-001",
                device_name="Test Meter",
                device_type="Meter",
                current_temperature=25.5,
            )
            
            response = client.get("/api/meters/device-001/history?time_scale=hour")
            
            assert response.status_code == 200
            data = response.json()
            assert data["device"] is not None
            assert data["device"]["device_id"] == "device-001"
            assert data["device"]["device_name"] == "Test Meter"
        finally:
            main_module.DB_PATH = original_db_path


class TestRefreshMetersEndpoint:
    def test_refresh_meters_no_credentials(self, client):
        with patch.object(main_module, "SWITCHBOT_TOKEN", ""), \
             patch.object(main_module, "SWITCHBOT_SECRET", ""):
            response = client.post("/api/meters/refresh")
            
            assert response.status_code == 500
            assert "credentials not configured" in response.json()["detail"].lower()

    def test_refresh_meters_success(self, client, reset_data_store):
        with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
             patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
             patch("app.main.collect_data", new_callable=AsyncMock) as mock_collect:
            
            data_store.devices["device-001"] = MeterDevice(
                device_id="device-001",
                device_name="Test Meter",
                device_type="Meter",
            )
            
            response = client.post("/api/meters/refresh")
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ok"
            assert data["meters_count"] == 1
            mock_collect.assert_called_once()


class TestGetStatusEndpoint:
    def test_get_status_configured(self, client, reset_data_store):
        with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
             patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"):
            
            data_store.devices["device-001"] = MeterDevice(
                device_id="device-001",
                device_name="Test Meter",
                device_type="Meter",
            )
            
            response = client.get("/api/status")
            
            assert response.status_code == 200
            data = response.json()
            assert data["configured"] is True
            assert data["meters_count"] == 1
            assert data["collection_interval"] == 3600

    def test_get_status_not_configured(self, client, reset_data_store):
        with patch.object(main_module, "SWITCHBOT_TOKEN", ""), \
             patch.object(main_module, "SWITCHBOT_SECRET", ""):
            response = client.get("/api/status")
            
            assert response.status_code == 200
            data = response.json()
            assert data["configured"] is False

    def test_get_status_rate_limited(self, client, reset_data_store):
        data_store.backoff_until = time.time() + 60
        
        with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
             patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"):
            response = client.get("/api/status")
            
            assert response.status_code == 200
            data = response.json()
            assert data["is_rate_limited"] is True
            assert data["backoff_remaining"] > 0

    def test_get_status_not_rate_limited(self, client, reset_data_store):
        data_store.backoff_until = 0
        
        with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
             patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"):
            response = client.get("/api/status")
            
            assert response.status_code == 200
            data = response.json()
            assert data["is_rate_limited"] is False
            assert data["backoff_remaining"] == 0


class TestImportDataEndpoint:
    async def test_import_data_creates_devices(self, client, reset_data_store, temp_db_path, admin_headers):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            import_data = {
                "devices": [
                    {
                        "device_id": "device-001",
                        "device_name": "Imported Meter",
                        "device_type": "Meter",
                        "current_temperature": 25.5,
                        "current_humidity": 60,
                        "battery": 85,
                        "last_updated": "2024-01-01T12:00:00Z",
                        "readings": [],
                    }
                ]
            }
            
            response = client.post("/api/import", json=import_data, headers=admin_headers)
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ok"
            assert data["imported_devices"] == 1
            assert data["imported_readings"] == 0
            
            assert "device-001" in data_store.devices
            assert data_store.devices["device-001"].device_name == "Imported Meter"
        finally:
            main_module.DB_PATH = original_db_path

    async def test_import_data_creates_readings(self, client, reset_data_store, temp_db_path, admin_headers):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            import_data = {
                "devices": [
                    {
                        "device_id": "device-001",
                        "device_name": "Imported Meter",
                        "device_type": "Meter",
                        "readings": [
                            {
                                "timestamp": "2024-01-01T11:00:00Z",
                                "temperature": 24.5,
                                "humidity": 58,
                                "battery": 86,
                            },
                            {
                                "timestamp": "2024-01-01T12:00:00Z",
                                "temperature": 25.5,
                                "humidity": 60,
                                "battery": 85,
                            },
                        ],
                    }
                ]
            }
            
            response = client.post("/api/import", json=import_data, headers=admin_headers)
            
            assert response.status_code == 200
            data = response.json()
            assert data["imported_devices"] == 1
            assert data["imported_readings"] == 2
        finally:
            main_module.DB_PATH = original_db_path

    async def test_import_data_multiple_devices(self, client, reset_data_store, temp_db_path, admin_headers):
        original_db_path = main_module.DB_PATH
        main_module.DB_PATH = temp_db_path
        
        try:
            await init_database()
            
            import_data = {
                "devices": [
                    {
                        "device_id": "device-001",
                        "device_name": "Meter 1",
                        "device_type": "Meter",
                        "readings": [],
                    },
                    {
                        "device_id": "device-002",
                        "device_name": "Meter 2",
                        "device_type": "MeterPlus",
                        "readings": [],
                    },
                ]
            }
            
            response = client.post("/api/import", json=import_data, headers=admin_headers)
            
            assert response.status_code == 200
            data = response.json()
            assert data["imported_devices"] == 2
            
            assert "device-001" in data_store.devices
            assert "device-002" in data_store.devices
        finally:
            main_module.DB_PATH = original_db_path

    def test_import_data_empty_devices(self, client, reset_data_store, admin_headers):
        import_data = {"devices": []}
        
        response = client.post("/api/import", json=import_data, headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["imported_devices"] == 0
        assert data["imported_readings"] == 0


def _valid_import_payload() -> dict:
    return {
        "devices": [
            {
                "device_id": "device-001",
                "device_name": "Imported Meter",
                "device_type": "Meter",
                "readings": [
                    {
                        "timestamp": "2024-01-01T12:00:00Z",
                        "temperature": 25.5,
                        "humidity": 60,
                        "battery": 85,
                    }
                ],
            }
        ]
    }


class TestImportDataAuth:
    def test_import_without_api_key_returns_401(self, client):
        response = client.post("/api/import", json=_valid_import_payload())

        assert response.status_code == 401
        assert "device-001" not in data_store.devices

    def test_import_with_wrong_api_key_returns_401(self, client):
        response = client.post(
            "/api/import", json=_valid_import_payload(), headers={"X-API-Key": "wrong-key"}
        )

        assert response.status_code == 401
        assert "device-001" not in data_store.devices

    def test_import_with_non_ascii_api_key_returns_401(self, client):
        response = client.post(
            "/api/import",
            json=_valid_import_payload(),
            headers={"X-API-Key": "キー".encode("utf-8")},
        )

        assert response.status_code == 401

    def test_import_when_admin_key_not_configured_returns_503(self, client, admin_headers, monkeypatch):
        monkeypatch.setattr(main_module, "ADMIN_API_KEY", "")

        response = client.post("/api/import", json=_valid_import_payload(), headers=admin_headers)

        assert response.status_code == 503
        assert "device-001" not in data_store.devices

    def test_import_with_valid_api_key_returns_200(self, client, admin_headers):
        response = client.post("/api/import", json=_valid_import_payload(), headers=admin_headers)

        assert response.status_code == 200
        assert response.json()["imported_readings"] == 1
        assert "device-001" in data_store.devices


class TestImportDataValidation:
    @pytest.mark.parametrize(
        "device_id",
        ["../x", "", "a" * 65, "dev ice", "dev/ice"],
    )
    def test_invalid_device_id_returns_422(self, client, admin_headers, device_id):
        payload = _valid_import_payload()
        payload["devices"][0]["device_id"] = device_id

        response = client.post("/api/import", json=payload, headers=admin_headers)

        assert response.status_code == 422
        assert device_id not in data_store.devices

    def test_humidity_out_of_range_returns_422(self, client, admin_headers):
        payload = _valid_import_payload()
        payload["devices"][0]["readings"][0]["humidity"] = 101

        response = client.post("/api/import", json=payload, headers=admin_headers)

        assert response.status_code == 422

    def test_battery_out_of_range_returns_422(self, client, admin_headers):
        payload = _valid_import_payload()
        payload["devices"][0]["readings"][0]["battery"] = -1

        response = client.post("/api/import", json=payload, headers=admin_headers)

        assert response.status_code == 422

    @pytest.mark.parametrize("temperature", [-100.1, 150.1])
    def test_temperature_out_of_range_returns_422(self, client, admin_headers, temperature):
        payload = _valid_import_payload()
        payload["devices"][0]["readings"][0]["temperature"] = temperature

        response = client.post("/api/import", json=payload, headers=admin_headers)

        assert response.status_code == 422

    def test_invalid_timestamp_returns_422(self, client, admin_headers):
        payload = _valid_import_payload()
        payload["devices"][0]["readings"][0]["timestamp"] = "bad"

        response = client.post("/api/import", json=payload, headers=admin_headers)

        assert response.status_code == 422

    def test_invalid_last_updated_returns_422(self, client, admin_headers):
        payload = _valid_import_payload()
        payload["devices"][0]["last_updated"] = "bad"

        response = client.post("/api/import", json=payload, headers=admin_headers)

        assert response.status_code == 422

    def test_device_name_too_long_returns_422(self, client, admin_headers):
        payload = _valid_import_payload()
        payload["devices"][0]["device_name"] = "a" * 129

        response = client.post("/api/import", json=payload, headers=admin_headers)

        assert response.status_code == 422

    def test_too_many_devices_returns_422(self, client, admin_headers):
        device = _valid_import_payload()["devices"][0]
        payload = {"devices": [dict(device, device_id=f"device-{i}") for i in range(101)]}

        response = client.post("/api/import", json=payload, headers=admin_headers)

        assert response.status_code == 422
        assert data_store.devices == {}


class TestBackupEndpoint:
    def test_backup_without_api_key_returns_401(self, client):
        response = client.get("/api/backup")

        assert response.status_code == 401

    def test_backup_with_wrong_api_key_returns_401(self, client):
        response = client.get("/api/backup", headers={"X-API-Key": "wrong-key"})

        assert response.status_code == 401

    def test_backup_when_admin_key_not_configured_returns_503(self, client, admin_headers, monkeypatch):
        monkeypatch.setattr(main_module, "ADMIN_API_KEY", "")

        response = client.get("/api/backup", headers=admin_headers)

        assert response.status_code == 503

    def test_backup_with_valid_api_key_returns_db(self, client, admin_headers):
        response = client.get("/api/backup", headers=admin_headers)

        assert response.status_code == 200
        assert response.headers["content-type"] == "application/x-sqlite3"
        assert response.content.startswith(b"SQLite format 3")
