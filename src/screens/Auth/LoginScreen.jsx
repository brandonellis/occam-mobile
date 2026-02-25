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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import useAuth from '../../hooks/useAuth';
import { getGoogleAuthUrl } from '../../services/auth.api';
import { searchTenants } from '../../services/tenants.api';
import { loginStyles as styles } from '../../styles/login.styles';
import { colors } from '../../theme';

const logoColor = require('../../../assets/images/logo-color.png');

const LoginScreen = () => {
  const { login, loginWithGoogle, isLoading, error, clearError } = useAuth();
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

  const handleGoogleSignIn = useCallback(async () => {
    if (!selectedOrg) return;

    setGoogleLoading(true);
    if (error) clearError();

    try {
      const returnUrl = '/auth/google/callback';
      const { redirect_url } = await getGoogleAuthUrl(selectedOrg.id, returnUrl);

      if (!redirect_url) {
        throw new Error('No redirect URL received');
      }

      const result = await WebBrowser.openAuthSessionAsync(
        redirect_url,
        'occamgolf://auth/google/callback'
      );

      if (result.type === 'success' && result.url) {
        const parsed = Linking.parse(result.url);
        const accessToken = parsed.queryParams?.access_token;
        const userParam = parsed.queryParams?.user;
        const success = parsed.queryParams?.success;

        if (success === 'true' && accessToken && userParam) {
          const userData = JSON.parse(atob(userParam));
          await loginWithGoogle(accessToken, userData, selectedOrg.id);
        }
      }
    } catch (err) {
      console.warn('Google sign-in error:', err);
    } finally {
      setGoogleLoading(false);
    }
  }, [selectedOrg, error, clearError, loginWithGoogle]);

  const handleFieldChange = useCallback(
    (setter) => (value) => {
      if (error) clearError();
      setter(value);
    },
    [error, clearError]
  );

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
            <View style={styles.fieldGroup}>
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
                  Type your gym, academy, or studio name
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
                    source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
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

            <TouchableOpacity style={styles.forgotPassword} activeOpacity={0.6}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
