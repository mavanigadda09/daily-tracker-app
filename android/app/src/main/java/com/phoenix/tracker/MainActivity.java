package com.phoenix.tracker;

import android.content.Intent;
import android.os.Bundle;

import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(GoogleAuthPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

@CapacitorPlugin(name = "GoogleAuth")
class GoogleAuthPlugin extends Plugin {

    private static final String WEB_CLIENT_ID =
        "287796839565-ds6ag7l9io777n0limmnctq3i4c1sne6.apps.googleusercontent.com";

    private PluginCall savedCall;
    private ActivityResultLauncher<Intent> signInLauncher;

    @Override
    public void load() {
        // Register the launcher during plugin load — must be before any user interaction
        signInLauncher = getActivity().registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            this::handleSignInResult
        );
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        savedCall = call;

        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(
            GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(WEB_CLIENT_ID)
            .requestEmail()
            .build();

        GoogleSignInClient client = GoogleSignIn.getClient(getActivity(), gso);

        // Always sign out first to force account picker
        client.signOut().addOnCompleteListener(task -> {
            signInLauncher.launch(client.getSignInIntent());
        });
    }

    private void handleSignInResult(ActivityResult result) {
        if (savedCall == null) return;

        Task<GoogleSignInAccount> task =
            GoogleSignIn.getSignedInAccountFromIntent(result.getData());

        try {
            GoogleSignInAccount account = task.getResult(ApiException.class);
            JSObject ret = new JSObject();
            ret.put("idToken",      account.getIdToken());
            ret.put("email",        account.getEmail());
            ret.put("displayName",  account.getDisplayName());
            savedCall.resolve(ret);
        } catch (ApiException e) {
            savedCall.reject("Google Sign-In failed", String.valueOf(e.getStatusCode()));
        } finally {
            savedCall = null;
        }
    }
}