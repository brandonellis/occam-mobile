import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import useAuth from '../../hooks/useAuth';
import { googleSignInNative } from '../../services/auth.api';
import { searchTenants } from '../../services/tenants.api';
import { loginStyles as styles } from '../../styles/login.styles';
import { colors } from '../../theme';
import config from '../../config';

const logoColor = require('../../../assets/images/logo-color.png');
const googleIcon = require('../../../assets/images/g-logo.png');

const LoginScreen = () => {
  const { login, loginWithGoogle, isLoading, error, clearError, setError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  // Organization search state
  const [orgQuery, setOrgQuery] = useState('');
  const [orgResults, setOrgResults] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimer = useRef(null);

  // Debounced search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (orgQuery.length < 2 || selectedOrg) {
      setOrgResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const results = await searchTenants(orgQuery);
        setOrgResults(results);
        setShowResults(results.length > 0);
      } catch {
        setOrgResults([]);
        setShowResults(false);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [orgQuery, selectedOrg]);

  const handleSelectOrg = useCallback((org) => {
    setSelectedOrg(org);
    setOrgQuery(org.name || org.domain || org.id);
    setShowResults(false);
    setOrgResults([]);
  }, []);

  const handleClearOrg = useCallback(() => {
    setSelectedOrg(null);
    setOrgQuery('');
    setOrgResults([]);
    setShowResults(false);
  }, []);

  const handleOrgQueryChange = useCallback((text) => {
    if (error) clearError();
    if (selectedOrg) {
      setSelectedOrg(null);
    }
    setOrgQuery(text);
  }, [error, clearError, selectedOrg]);

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password.trim() || !selectedOrg) return;
    await login(email.trim(), password, selectedOrg.id);
  }, [email, password, selectedOrg, login]);

  const [googleLoading, setGoogleLoading] = useState(false);

  // Configure Google Sign-In once on mount
  useEffect(() => {
    if (config.googleWebClientId) {
      GoogleSignin.configure({
        webClientId: config.googleWebClientId,
        iosClientId: config.googleIosClientId,
        offlineAccess: false,
      });
    }
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    if (!selectedOrg) return;

    setGoogleLoading(true);
    if (error) clearError();

    try {
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;

      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      // Send idToken to backend for verification + Sanctum token exchange
      const { data } = await googleSignInNative(idToken, selectedOrg.id);

      if (data?.token && data?.user) {
        await loginWithGoogle(data.token, data.user, selectedOrg.id);
      }
    } catch (err) {
      if (isErrorWithCode(err)) {
        if (err.code === statusCodes.SIGN_IN_CANCELLED) {
          // User cancelled — do nothing
          return;
        }
        if (err.code === statusCodes.IN_PROGRESS) {
          return;
        }
      }
      const message = err?.response?.data?.message || err?.message || 'Google sign-in failed. Please try again.';
      setError(message);
      console.warn('Google sign-in error:', message);
    } finally {
      setGoogleLoading(false);
    }
  }, [selectedOrg, error, clearError, setError, loginWithGoogle]);

  const handleFieldChange = useCallback(
    (setter) => (value) => {
      if (error) clearError();
      setter(value);
    },
    [error, clearError]
  );

  const handleForgotPassword = useCallback(() => {
    if (!selectedOrg) {
      Alert.alert('Organization Required', 'Please select your organization first so we can direct you to the correct password reset page.');
      return;
    }
    const domain = selectedOrg.domain || `${selectedOrg.id}.occam.golf`;
    const resetUrl = `https://${domain}/forgot-password`;
    Linking.openURL(resetUrl).catch(() => {
      Alert.alert('Unable to Open', 'Could not open the password reset page. Please visit your organization\'s website directly.');
    });
  }, [selectedOrg]);

  const isFormValid = email.trim() && password.trim() && selectedOrg;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Image source={logoColor} style={styles.logoImage} />
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            {/* Organization search field */}
            <View style={[styles.fieldGroup, { zIndex: 10 }]}>
              <Text style={styles.label}>Organization</Text>
              <View style={[
                styles.input,
                styles.orgInputRow,
                focusedField === 'tenant' && styles.inputFocused,
                selectedOrg && styles.orgInputSelected,
              ]}>
                {selectedOrg ? (
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                ) : (
                  <Ionicons name="search" size={16} color="rgba(255,255,255,0.4)" />
                )}
                <TextInput
                  style={styles.orgTextInput}
                  placeholder="Search your organization..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={orgQuery}
                  onChangeText={handleOrgQueryChange}
                  onFocus={() => setFocusedField('tenant')}
                  onBlur={() => {
                    setFocusedField(null);
                    setTimeout(() => setShowResults(false), 200);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {isSearching && (
                  <ActivityIndicator size="small" color={colors.accent} />
                )}
                {selectedOrg && (
                  <TouchableOpacity onPress={handleClearOrg} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Search results dropdown */}
              {showResults && (
                <View style={styles.orgDropdown}>
                  {orgResults.map((org) => (
                    <TouchableOpacity
                      key={org.id}
                      style={styles.orgResultItem}
                      onPress={() => handleSelectOrg(org)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.orgResultIcon}>
                        <Ionicons name="business-outline" size={16} color={colors.accent} />
                      </View>
                      <View style={styles.orgResultText}>
                        <Text style={styles.orgResultName}>{org.name || org.id}</Text>
                        <Text style={styles.orgResultDomain}>{org.domain || org.id}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {!selectedOrg && orgQuery.length === 0 && (
                <Text style={styles.fieldHint}>
                  Type your business, academy, or facility name
                </Text>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'email' && styles.inputFocused,
                ]}
                placeholder="Enter your email"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={email}
                onChangeText={handleFieldChange(setEmail)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'password' && styles.inputFocused,
                ]}
                placeholder="Enter your password"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={password}
                onChangeText={handleFieldChange(setPassword)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                secureTextEntry
                textContentType="password"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                (!isFormValid || isLoading) && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={!isFormValid || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign-In */}
            <TouchableOpacity
              style={[
                styles.googleButton,
                (!selectedOrg || googleLoading) && styles.googleButtonDisabled,
              ]}
              onPress={handleGoogleSignIn}
              disabled={!selectedOrg || googleLoading}
              activeOpacity={0.8}
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <>
                  <Image
                    source={googleIcon}
                    style={styles.googleIcon}
                  />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            {!selectedOrg && (
              <Text style={styles.googleHint}>
                Select your organization first to sign in with Google
              </Text>
            )}

            <TouchableOpacity style={styles.forgotPassword} activeOpacity={0.6} onPress={handleForgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
