from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from app.main import (
    ImportData,
    ImportDeviceData,
    ImportReadingData,
    MeterDevice,
    MeterReading,
    TimeScale,
)


class TestTimeScaleEnum:
    def test_time_scale_hour_value(self):
        assert TimeScale.HOUR.value == "hour"

    def test_time_scale_day_value(self):
        assert TimeScale.DAY.value == "day"

    def test_time_scale_week_value(self):
        assert TimeScale.WEEK.value == "week"

    def test_time_scale_month_value(self):
        assert TimeScale.MONTH.value == "month"

    def test_time_scale_year_value(self):
        assert TimeScale.YEAR.value == "year"

    def test_time_scale_from_string(self):
        assert TimeScale("hour") == TimeScale.HOUR
        assert TimeScale("day") == TimeScale.DAY
        assert TimeScale("week") == TimeScale.WEEK
        assert TimeScale("month") == TimeScale.MONTH
        assert TimeScale("year") == TimeScale.YEAR

    def test_time_scale_invalid_value(self):
        with pytest.raises(ValueError):
            TimeScale("invalid")


class TestMeterReading:
    def test_meter_reading_valid_data(self):
        reading = MeterReading(
            timestamp=datetime.now(timezone.utc),
            temperature=25.5,
            humidity=60,
            battery=85,
        )
        assert reading.temperature == 25.5
        assert reading.humidity == 60
        assert reading.battery == 85

    def test_meter_reading_optional_battery(self):
        reading = MeterReading(
            timestamp=datetime.now(timezone.utc),
            temperature=25.5,
            humidity=60,
        )
        assert reading.battery is None

    def test_meter_reading_negative_temperature(self):
        reading = MeterReading(
            timestamp=datetime.now(timezone.utc),
            temperature=-10.5,
            humidity=60,
        )
        assert reading.temperature == -10.5

    def test_meter_reading_zero_humidity(self):
        reading = MeterReading(
            timestamp=datetime.now(timezone.utc),
            temperature=25.5,
            humidity=0,
        )
        assert reading.humidity == 0

    def test_meter_reading_model_dump(self):
        now = datetime.now(timezone.utc)
        reading = MeterReading(
            timestamp=now,
            temperature=25.5,
            humidity=60,
            battery=85,
        )
        data = reading.model_dump()
        assert data["timestamp"] == now
        assert data["temperature"] == 25.5
        assert data["humidity"] == 60
        assert data["battery"] == 85


class TestMeterDevice:
    def test_meter_device_required_fields(self):
        device = MeterDevice(
            device_id="test-001",
            device_name="Test Meter",
            device_type="Meter",
        )
        assert device.device_id == "test-001"
        assert device.device_name == "Test Meter"
        assert device.device_type == "Meter"

    def test_meter_device_optional_fields_default_none(self):
        device = MeterDevice(
            device_id="test-001",
            device_name="Test Meter",
            device_type="Meter",
        )
        assert device.hub_device_id is None
        assert device.current_temperature is None
        assert device.current_humidity is None
        assert device.battery is None
        assert device.last_updated is None

    def test_meter_device_all_fields(self):
        now = datetime.now(timezone.utc)
        device = MeterDevice(
            device_id="test-001",
            device_name="Test Meter",
            device_type="MeterPlus",
            hub_device_id="hub-001",
            current_temperature=25.5,
            current_humidity=60,
            battery=85,
            last_updated=now,
        )
        assert device.device_id == "test-001"
        assert device.device_name == "Test Meter"
        assert device.device_type == "MeterPlus"
        assert device.hub_device_id == "hub-001"
        assert device.current_temperature == 25.5
        assert device.current_humidity == 60
        assert device.battery == 85
        assert device.last_updated == now

    def test_meter_device_missing_required_field(self):
        with pytest.raises(ValidationError):
            MeterDevice(
                device_name="Test Meter",
                device_type="Meter",
            )

    def test_meter_device_model_dump(self):
        device = MeterDevice(
            device_id="test-001",
            device_name="Test Meter",
            device_type="Meter",
        )
        data = device.model_dump()
        assert "device_id" in data
        assert "device_name" in data
        assert "device_type" in data


class TestImportReadingData:
    def test_import_reading_data_valid(self):
        reading = ImportReadingData(
            timestamp="2024-01-01T12:00:00Z",
            temperature=25.5,
            humidity=60,
            battery=85,
        )
        assert reading.timestamp == datetime(2024, 1, 1, 12, 0, tzinfo=timezone.utc)
        assert reading.temperature == 25.5
        assert reading.humidity == 60
        assert reading.battery == 85

    def test_import_reading_data_optional_battery(self):
        reading = ImportReadingData(
            timestamp="2024-01-01T12:00:00Z",
            temperature=25.5,
            humidity=60,
        )
        assert reading.battery is None


class TestImportDeviceData:
    def test_import_device_data_minimal(self):
        device = ImportDeviceData(
            device_id="test-001",
            device_name="Test Meter",
            device_type="Meter",
        )
        assert device.device_id == "test-001"
        assert device.readings == []

    def test_import_device_data_with_readings(self):
        device = ImportDeviceData(
            device_id="test-001",
            device_name="Test Meter",
            device_type="Meter",
            readings=[
                ImportReadingData(
                    timestamp="2024-01-01T12:00:00Z",
                    temperature=25.5,
                    humidity=60,
                )
            ],
        )
        assert len(device.readings) == 1
        assert device.readings[0].temperature == 25.5


class TestImportData:
    def test_import_data_empty_devices(self):
        data = ImportData(devices=[])
        assert data.devices == []

    def test_import_data_with_devices(self):
        data = ImportData(
            devices=[
                ImportDeviceData(
                    device_id="test-001",
                    device_name="Test Meter",
                    device_type="Meter",
                )
            ]
        )
        assert len(data.devices) == 1
        assert data.devices[0].device_id == "test-001"

    def test_import_data_nested_structure(self):
        data = ImportData(
            devices=[
                ImportDeviceData(
                    device_id="test-001",
                    device_name="Test Meter",
                    device_type="Meter",
                    current_temperature=25.5,
                    current_humidity=60,
                    battery=85,
                    last_updated="2024-01-01T12:00:00Z",
                    readings=[
                        ImportReadingData(
                            timestamp="2024-01-01T11:00:00Z",
                            temperature=24.5,
                            humidity=58,
                            battery=86,
                        ),
                        ImportReadingData(
                            timestamp="2024-01-01T12:00:00Z",
                            temperature=25.5,
                            humidity=60,
                            battery=85,
                        ),
                    ],
                )
            ]
        )
        assert len(data.devices) == 1
        assert len(data.devices[0].readings) == 2
        assert data.devices[0].readings[0].temperature == 24.5
        assert data.devices[0].readings[1].temperature == 25.5
