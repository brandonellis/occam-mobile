import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  StatusBar,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
// Lazy-load Google Sign-In — native module unavailable on iOS Simulator / Expo Go
let GoogleSignin = null;
let isErrorWithCode = () => false;
let statusCodes = {};
try {
  const gsi = require('@react-native-google-signin/google-signin');
  GoogleSignin = gsi.GoogleSignin;
  isErrorWithCode = gsi.isErrorWithCode;
  statusCodes = gsi.statusCodes;
} catch (e) {
  // Native module not available — Google Sign-In will be disabled
}
import useAuth from '../../hooks/useAuth';
import { googleSignInNative, appleSignInNative, forgotPassword } from '../../services/auth.api';
import { searchTenants } from '../../services/tenants.api';
import { getLastOrg, setLastOrg } from '../../helpers/storage.helper';
import { loginStyles as styles } from '../../styles/login.styles';
import { colors } from '../../theme';
import config from '../../config';
import logger from '../../helpers/logger.helper';

// Lazy-load Apple Authentication — only available on iOS with native build
let AppleAuthentication = null;
try {
  AppleAuthentication = require('expo-apple-authentication');
} catch (e) {
  // Native module not available — Apple Sign-In will be disabled
}

const logoColor = require('../../../assets/images/logo-color.png');
const googleIcon = require('../../../assets/images/g-logo.png');

const LoginScreen = () => {
  const { login, loginWithGoogle, isLoading, error, clearError, setError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Organization search state
  const [orgQuery, setOrgQuery] = useState('');
  const [orgResults, setOrgResults] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimer = useRef(null);
  const abortRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const resetEmailInputRef = useRef(null);

  // Load last selected organization on mount
  useEffect(() => {
    const loadLastOrg = async () => {
      try {
        const saved = await getLastOrg();
        if (saved) {
          setSelectedOrg(saved);
          setOrgQuery(saved.name || saved.domain || saved.id);
        }
      } catch (e) {
        // Ignore storage errors
      }
    };
    loadLastOrg();
  }, []);

  // Debounced search with request cancellation
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (abortRef.current) abortRef.current.abort();

    if (orgQuery.length < 2 || selectedOrg) {
      setOrgResults([]);
      setShowResults(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimer.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const results = await searchTenants(orgQuery, controller.signal);
        if (!controller.signal.aborted) {
          setOrgResults(results);
          setShowResults(results.length > 0);
        }
      } catch {
        if (!controller.signal.aborted) {
          setOrgResults([]);
          setShowResults(false);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 400);

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      if (abortRef.current) abortRef.current.abort();
      setIsSearching(false);
    };
  }, [orgQuery, selectedOrg]);

  const handleSelectOrg = useCallback((org) => {
    setSelectedOrg(org);
    setOrgQuery(org.name || org.domain || org.id);
    setShowResults(false);
    setOrgResults([]);
    setLastOrg(org).catch(() => {});
  }, []);

  const handleClearOrg = useCallback(() => {
    setSelectedOrg(null);
    setOrgQuery('');
    setOrgResults([]);
    setShowResults(false);
  }, []);

  const handleOrgQueryChange = useCallback((text) => {
    if (error) clearError();
    setFieldErrors((prev) => {
      if (prev.org) return { ...prev, org: undefined };
      return prev;
    });
    if (selectedOrg) {
      setSelectedOrg(null);
    }
    setOrgQuery(text);
  }, [error, clearError, selectedOrg, fieldErrors.org]);

  const handleLogin = useCallback(async () => {
    const errors = {};
    if (!selectedOrg) errors.org = 'Please select your organization';
    if (!email.trim()) errors.email = 'Email is required';
    if (!password.trim()) errors.password = 'Password is required';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    await login(email.trim(), password, selectedOrg.id);
  }, [email, password, selectedOrg, login]);

  const [googleLoading, setGoogleLoading] = useState(false);

  // Configure Google Sign-In once on mount
  // Wrapped in try/catch — native module unavailable in Expo Go
  const [googleAvailable, setGoogleAvailable] = useState(false);
  useEffect(() => {
    if (config.googleWebClientId && GoogleSignin) {
      try {
        GoogleSignin.configure({
          webClientId: config.googleWebClientId,
          iosClientId: config.googleIosClientId,
          ...(Platform.OS === 'android' && config.googleAndroidClientId
            ? { androidClientId: config.googleAndroidClientId }
            : {}),
          offlineAccess: false,
        });
        setGoogleAvailable(true);
      } catch (err) {
        logger.warn('Google Sign-In not available (Expo Go?):', err.message);
      }
    }
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    if (!selectedOrg || !googleAvailable) return;

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
      logger.warn('Google sign-in error:', message);
    } finally {
      setGoogleLoading(false);
    }
  }, [selectedOrg, error, clearError, setError, loginWithGoogle]);

  // Apple Sign-In availability and handler
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios' && AppleAuthentication) {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => {});
    }
  }, []);

  const handleAppleSignIn = useCallback(async () => {
    if (!selectedOrg || !appleAvailable) return;

    setAppleLoading(true);
    if (error) clearError();

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const identityToken = credential.identityToken;
      if (!identityToken) {
        throw new Error('No identity token received from Apple');
      }

      // Apple only provides the name on the very first sign-in
      const fullName = credential.fullName
        ? { givenName: credential.fullName.givenName, familyName: credential.fullName.familyName }
        : null;

      const { data } = await appleSignInNative(identityToken, selectedOrg.id, fullName);

      if (data?.token && data?.user) {
        await loginWithGoogle(data.token, data.user, selectedOrg.id);
      }
    } catch (err) {
      // User cancelled — do nothing
      if (err.code === 'ERR_REQUEST_CANCELED') {
        return;
      }
      const message = err?.response?.data?.message || err?.message || 'Apple sign-in failed. Please try again.';
      setError(message);
      logger.warn('Apple sign-in error:', message);
    } finally {
      setAppleLoading(false);
    }
  }, [selectedOrg, appleAvailable, error, clearError, setError, loginWithGoogle]);

  const handleFieldChange = useCallback(
    (setter, field) => (value) => {
      if (error) clearError();
      setFieldErrors((prev) => {
        if (prev[field]) return { ...prev, [field]: undefined };
        return prev;
      });
      setter(value);
    },
    [error, clearError, fieldErrors]
  );

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleForgotPassword = useCallback(() => {
    if (!selectedOrg) {
      Alert.alert('Organization Required', 'Please select your organization first.');
      return;
    }
    setResetEmail(email);
    setShowForgotPassword(true);
    if (error) clearError();
  }, [selectedOrg, email, error, clearError]);

  const handleSendResetLink = useCallback(async () => {
    if (!resetEmail.trim()) {
      Alert.alert('Email Required', 'Please enter your email address.');
      return;
    }
    setResetLoading(true);
    try {
      await forgotPassword(resetEmail.trim());
      Alert.alert(
        'Check Your Email',
        'If an account exists with that email, a password reset link has been sent.',
        [{ text: 'OK', onPress: () => setShowForgotPassword(false) }]
      );
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to send reset email. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setResetLoading(false);
    }
  }, [resetEmail]);

  const handleBackToLogin = useCallback(() => {
    setShowForgotPassword(false);
    if (error) clearError();
  }, [error, clearError]);

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
            <Image
              source={logoColor}
              style={styles.logoImage}
              accessible={true}
              accessibilityLabel="Occam Golf logo"
            />
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
                fieldErrors.org && styles.inputError,
              ]}>
                {selectedOrg ? (
                  <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
                ) : (
                  <MaterialCommunityIcons name="magnify" size={16} color={colors.textInverseHint} />
                )}
                <TextInput
                  style={styles.orgTextInput}
                  placeholder="Search your organization..."
                  placeholderTextColor={colors.textInverseDisabled}
                  value={orgQuery}
                  onChangeText={handleOrgQueryChange}
                  onFocus={() => setFocusedField('tenant')}
                  onBlur={() => {
                    setFocusedField(null);
                    setTimeout(() => setShowResults(false), 200);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Organization search"
                  accessibilityHint="Type your business, academy, or facility name"
                />
                {isSearching && (
                  <ActivityIndicator size="small" color={colors.accent} />
                )}
                {selectedOrg && (
                  <TouchableOpacity
                    onPress={handleClearOrg}
                    hitSlop={{ top: 13, bottom: 13, left: 13, right: 13 }}
                    accessibilityLabel="Clear organization"
                    accessibilityRole="button"
                  >
                    <MaterialCommunityIcons name="close-circle" size={18} color={colors.textInverseSubdued} />
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
                      testID={`org-result-${org.id}`}
                      accessibilityLabel={org.name || org.id}
                      accessibilityRole="button"
                      accessibilityHint="Select this organization"
                    >
                      <View style={styles.orgResultIcon}>
                        <MaterialCommunityIcons name="domain" size={16} color={colors.accent} />
                      </View>
                      <View style={styles.orgResultText}>
                        <Text style={styles.orgResultName}>{org.name || org.id}</Text>
                        <Text style={styles.orgResultDomain}>{org.domain || org.id}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {!selectedOrg && orgQuery.length === 0 && !fieldErrors.org && (
                <Text style={styles.fieldHint}>
                  Type your business, academy, or facility name
                </Text>
              )}
              {fieldErrors.org && (
                <Text style={styles.fieldError}>{fieldErrors.org}</Text>
              )}
            </View>

            {showForgotPassword ? (
              <>
                <Text style={styles.forgotPasswordDescription}>
                  Enter your email address and we'll send you a link to reset your password.
                </Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Email</Text>
                  <Pressable onPress={() => resetEmailInputRef.current?.focus()}>
                    <TextInput
                      ref={resetEmailInputRef}
                      style={[
                        styles.input,
                        focusedField === 'resetEmail' && styles.inputFocused,
                      ]}
                      placeholder="Enter your email"
                      placeholderTextColor={colors.textInverseDisabled}
                      value={resetEmail}
                      onChangeText={setResetEmail}
                      onFocus={() => setFocusedField('resetEmail')}
                      onBlur={() => setFocusedField(null)}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      textContentType="emailAddress"
                      accessibilityLabel="Email"
                    />
                  </Pressable>
                </View>

                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    (!resetEmail.trim() || resetLoading) && styles.loginButtonDisabled,
                  ]}
                  onPress={handleSendResetLink}
                  disabled={!resetEmail.trim() || resetLoading}
                  activeOpacity={0.8}
                  accessibilityLabel={resetLoading ? 'Sending reset link' : 'Send Reset Link'}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !resetEmail.trim() || resetLoading }}
                >
                  {resetLoading ? (
                    <ActivityIndicator color={colors.textInverse} />
                  ) : (
                    <Text style={styles.loginButtonText}>Send Reset Link</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.forgotPassword}
                  activeOpacity={0.6}
                  onPress={handleBackToLogin}
                  accessibilityLabel="Back to Sign In"
                  accessibilityRole="button"
                >
                  <Text style={styles.forgotPasswordText}>Back to Sign In</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Email</Text>
                  <Pressable onPress={() => emailInputRef.current?.focus()}>
                    <TextInput
                      ref={emailInputRef}
                      style={[
                        styles.input,
                        focusedField === 'email' && styles.inputFocused,
                        fieldErrors.email && styles.inputError,
                      ]}
                      placeholder="Enter your email"
                      placeholderTextColor={colors.textInverseDisabled}
                      value={email}
                      onChangeText={handleFieldChange(setEmail, 'email')}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      textContentType="emailAddress"
                    />
                  </Pressable>
                  {fieldErrors.email && (
                    <Text style={styles.fieldError}>{fieldErrors.email}</Text>
                  )}
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Password</Text>
                  <Pressable onPress={() => passwordInputRef.current?.focus()}>
                    <TextInput
                      ref={passwordInputRef}
                      style={[
                        styles.input,
                        focusedField === 'password' && styles.inputFocused,
                        fieldErrors.password && styles.inputError,
                      ]}
                      placeholder="Enter your password"
                      placeholderTextColor={colors.textInverseDisabled}
                      value={password}
                      onChangeText={handleFieldChange(setPassword, 'password')}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      secureTextEntry
                      textContentType="password"
                    />
                  </Pressable>
                  {fieldErrors.password && (
                    <Text style={styles.fieldError}>{fieldErrors.password}</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    isLoading && styles.loginButtonDisabled,
                  ]}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                  accessibilityLabel={isLoading ? 'Signing in' : 'Sign In'}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isLoading }}
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
                  accessibilityLabel="Continue with Google"
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !selectedOrg || googleLoading }}
                >
                  {googleLoading ? (
                    <ActivityIndicator size="small" color={colors.textPrimary} />
                  ) : (
                    <>
                      <Image
                        source={googleIcon}
                        style={styles.googleIcon}
                        accessible={false}
                      />
                      <Text style={styles.googleButtonText}>Continue with Google</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Apple Sign-In (iOS only) */}
                {Platform.OS === 'ios' && appleAvailable && (
                  <TouchableOpacity
                    style={[
                      styles.appleButton,
                      (!selectedOrg || appleLoading) && styles.appleButtonDisabled,
                    ]}
                    onPress={handleAppleSignIn}
                    disabled={!selectedOrg || appleLoading}
                    activeOpacity={0.8}
                    accessibilityLabel="Continue with Apple"
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !selectedOrg || appleLoading }}
                  >
                    {appleLoading ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="apple" size={20} color={colors.white} />
                        <Text style={styles.appleButtonText}>Continue with Apple</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {!selectedOrg && (
                  <Text style={styles.googleHint}>
                    Select your organization first to sign in
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.forgotPassword}
                  activeOpacity={0.6}
                  onPress={handleForgotPassword}
                  accessibilityLabel="Forgot password"
                  accessibilityRole="button"
                >
                  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
