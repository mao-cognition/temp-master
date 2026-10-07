import asyncio
import os
import tempfile
from datetime import datetime, timezone
from typing import AsyncGenerator, Generator
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

os.environ["SWITCHBOT_TOKEN"] = ""
os.environ["SWITCHBOT_SECRET"] = ""
# 管理系 API（/api/import, /api/backup）のテスト用固定キー
TEST_ADMIN_API_KEY = "test-admin-key"
os.environ["ADMIN_API_KEY"] = TEST_ADMIN_API_KEY

from app.main import (
    DB_PATH,
    DataStore,
    MeterDevice,
    MeterReading,
    app,
    data_store,
    init_database,
)


@pytest.fixture
def temp_db_path(tmp_path) -> str:
    return str(tmp_path / "test.db")


@pytest.fixture
async def test_db(temp_db_path: str) -> AsyncGenerator[str, None]:
    import app.main as main_module
    
    original_db_path = main_module.DB_PATH
    main_module.DB_PATH = temp_db_path
    
    await init_database()
    
    yield temp_db_path
    
    main_module.DB_PATH = original_db_path


@pytest.fixture
async def reset_data_store(tmp_path) -> AsyncGenerator[DataStore, None]:
    import app.main as main_module
    
    original_devices = data_store.devices.copy()
    original_history = data_store.history.copy()
    original_last_api_call = data_store.last_api_call
    original_backoff_until = data_store.backoff_until
    original_consecutive_errors = data_store.consecutive_errors
    original_is_collecting = data_store.is_collecting
    original_db_initialized = data_store.db_initialized
    original_db_path = main_module.DB_PATH
    
    data_store.devices = {}
    data_store.history = {}
    data_store.last_api_call = 0
    data_store.backoff_until = 0
    data_store.consecutive_errors = 0
    data_store.is_collecting = False
    data_store.db_initialized = False
    
    main_module.DB_PATH = str(tmp_path / "test.db")
    await init_database()
    
    yield data_store
    
    data_store.devices = original_devices
    data_store.history = original_history
    data_store.last_api_call = original_last_api_call
    data_store.backoff_until = original_backoff_until
    data_store.consecutive_errors = original_consecutive_errors
    data_store.is_collecting = original_is_collecting
    data_store.db_initialized = original_db_initialized
    main_module.DB_PATH = original_db_path


@pytest.fixture
def sample_meter_device() -> MeterDevice:
    return MeterDevice(
        device_id="test-device-001",
        device_name="Test Meter",
        device_type="Meter",
        hub_device_id="hub-001",
        current_temperature=25.5,
        current_humidity=60,
        battery=85,
        last_updated=datetime.now(timezone.utc),
    )


@pytest.fixture
def sample_meter_reading() -> MeterReading:
    return MeterReading(
        timestamp=datetime.now(timezone.utc),
        temperature=25.5,
        humidity=60,
        battery=85,
    )


@pytest.fixture
def sample_switchbot_devices_response() -> dict:
    return {
        "statusCode": 100,
        "body": {
            "deviceList": [
                {
                    "deviceId": "device-001",
                    "deviceName": "Living Room Meter",
                    "deviceType": "Meter",
                    "hubDeviceId": "hub-001",
                },
                {
                    "deviceId": "device-002",
                    "deviceName": "Bedroom Meter",
                    "deviceType": "MeterPlus",
                    "hubDeviceId": "hub-001",
                },
                {
                    "deviceId": "device-003",
                    "deviceName": "Smart Light",
                    "deviceType": "Light",
                    "hubDeviceId": "hub-001",
                },
            ]
        },
        "message": "success",
    }


@pytest.fixture
def sample_switchbot_status_response() -> dict:
    return {
        "statusCode": 100,
        "body": {
            "deviceId": "device-001",
            "deviceType": "Meter",
            "temperature": 24.5,
            "humidity": 55,
            "battery": 90,
        },
        "message": "success",
    }


@pytest.fixture
def client(reset_data_store) -> TestClient:
    return TestClient(app)


@pytest.fixture
def mock_switchbot_credentials():
    with patch("app.main.SWITCHBOT_TOKEN", "test-token"), \
         patch("app.main.SWITCHBOT_SECRET", "test-secret"):
        yield


@pytest.fixture
def admin_headers() -> dict:
    return {"X-API-Key": TEST_ADMIN_API_KEY}
