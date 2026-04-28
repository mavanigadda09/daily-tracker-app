package com.phoenix.tracker;

import android.content.Context;
import android.content.pm.PackageManager;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "StepCounter",
    permissions = {
        @Permission(
            alias = "activityRecognition",
            strings = { "android.permission.ACTIVITY_RECOGNITION" }
        )
    }
)
public class StepCounterPlugin extends Plugin implements SensorEventListener {

    private static final String PERM_STRING = "android.permission.ACTIVITY_RECOGNITION";

    private SensorManager sensorManager;
    private Sensor        stepSensor;
    private boolean       isListening = false;
    private long          totalSteps  = -1;

    @Override
    public void load() {
        sensorManager = (SensorManager)
            getContext().getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager != null) {
            stepSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        }
    }

    // ─── checkPermission ─────────────────────────────────────────────────────
    // Returns "granted" | "denied" | "prompt"
    // On API < 29 (Android 9 and below) the permission didn't exist — always granted.

    @PluginMethod
    public void checkPermission(PluginCall call) {
        JSObject ret = new JSObject();

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            ret.put("state", "granted");
            call.resolve(ret);
            return;
        }

        int result = ContextCompat.checkSelfPermission(getContext(), PERM_STRING);
        if (result == PackageManager.PERMISSION_GRANTED) {
            ret.put("state", "granted");
        } else {
            // shouldShowRequestPermissionRationale is true only after the user
            // has denied once — maps to "denied" so the hook shows "try again".
            boolean shouldShow = getActivity()
                .shouldShowRequestPermissionRationale(PERM_STRING);
            ret.put("state", shouldShow ? "denied" : "prompt");
        }
        call.resolve(ret);
    }

    // ─── requestPermission ───────────────────────────────────────────────────
    // Triggers the system dialog. Result delivered to permissionCallback().

    @PluginMethod
    public void requestPermission(PluginCall call) {
        // Already granted — skip the dialog
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q
                || ContextCompat.checkSelfPermission(getContext(), PERM_STRING)
                   == PackageManager.PERMISSION_GRANTED) {
            JSObject ret = new JSObject();
            ret.put("state", "granted");
            call.resolve(ret);
            return;
        }

        requestPermissionForAlias("activityRecognition", call, "permissionCallback");
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        JSObject ret = new JSObject();
        int check = ContextCompat.checkSelfPermission(getContext(), PERM_STRING);
        ret.put("state",
            check == PackageManager.PERMISSION_GRANTED ? "granted" : "denied");
        call.resolve(ret);
    }

    // ─── isAvailable ─────────────────────────────────────────────────────────

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("available", stepSensor != null);
        call.resolve(ret);
    }

    // ─── startCounting ───────────────────────────────────────────────────────
    // Renamed from start() to match the JS hook's StepCounter.startCounting() call.

    @PluginMethod
    public void startCounting(PluginCall call) {
        if (stepSensor == null) {
            call.reject("Step counter sensor not available on this device.");
            return;
        }
        if (!isListening) {
            boolean ok = sensorManager.registerListener(
                this, stepSensor, SensorManager.SENSOR_DELAY_NORMAL);
            if (!ok) {
                call.reject("Failed to register sensor listener.");
                return;
            }
            isListening = true;
        }
        call.resolve();
    }

    // ─── stopCounting ────────────────────────────────────────────────────────
    // Renamed from stop() to match the JS hook's StepCounter.stopCounting() call.

    @PluginMethod
    public void stopCounting(PluginCall call) {
        if (isListening && sensorManager != null) {
            sensorManager.unregisterListener(this);
            isListening = false;
        }
        call.resolve();
    }

    // ─── getSteps ────────────────────────────────────────────────────────────

    @PluginMethod
    public void getSteps(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("available", stepSensor != null);
        ret.put("steps", totalSteps);
        call.resolve(ret);
    }

    // ─── SensorEventListener ─────────────────────────────────────────────────

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_STEP_COUNTER) {
            totalSteps = (long) event.values[0];
            JSObject data = new JSObject();
            data.put("steps", totalSteps);
            notifyListeners("stepUpdate", data);
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}

    // ─── Lifecycle ───────────────────────────────────────────────────────────

    @Override
    protected void handleOnDestroy() {
        if (isListening && sensorManager != null) {
            sensorManager.unregisterListener(this);
            isListening = false;
        }
        super.handleOnDestroy();
    }
}