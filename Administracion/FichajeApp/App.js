import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  Button, 
  Alert, 
  ActivityIndicator, 
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView, 
  Platform,
} from 'react-native';
import * as Location from 'expo-location';

// Realtime Database Imports
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push } from 'firebase/database'; 

// Firebase Auth Imports
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

// 🚨 CREDENCIALES FINALES DE FIREBASE 🚨
const firebaseConfig = {
  apiKey: "AIzaSyDM4HvPGHme9UTKiAxGgNuZJX_a5BUBtu4",
  authDomain: "controldeobranexus.firebaseapp.com",
  projectId: "controldeobranexus",
  storageBucket: "controldeobranexus.firebasestorage.app",
  messagingSenderId: "382485340614",
  appId: "1:382485340614:web:81f3e28baca08c57b412c7",
  databaseURL: "https://controldeobranexus-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const dbRTDB = getDatabase(app);
const auth = getAuth(app);


// --- Configuración de Geo-Cerca ---
const ZONA_AUTORIZADA = {
  lat: 4.533000, 
  lon: -75.675000,
  radio: 200, 
};
const distancia = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; 
    const toRad = v => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
};


// ==========================================================
// PANTALLA DE FICHAJE (Solo visible después del Login)
// ==========================================================

const FichajeScreen = ({ user, handleLogout }) => {
  // El ID del empleado es ahora el email del usuario autenticado
  const [empleadoId, setEmpleadoId] = useState(user.email);
  const [actividad, setActividad] = useState('Obra Consorcio Principal');
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensajeEstado, setMensajeEstado] = useState('Esperando ubicación...');
  const [ultimaCoordenada, setUltimaCoordenada] = useState(null);

  // 1. Obtener Permisos y Ubicación
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permiso para acceder a la ubicación denegado.');
        return;
      }
      
      const listener = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (newLocation) => {
          setLocation(newLocation);
          setUltimaCoordenada({ lat: newLocation.coords.latitude, lon: newLocation.coords.longitude });
          
          const dist = distancia(
            newLocation.coords.latitude,
            newLocation.coords.longitude,
            ZONA_AUTORIZADA.lat,
            ZONA_AUTORIZADA.lon
          );
          
          if (dist <= ZONA_AUTORIZADA.radio) {
            setMensajeEstado(`GPS OK (${dist.toFixed(0)}m). Dentro de Geo-cerca.`);
          } else {
            setMensajeEstado(`GPS OK (${dist.toFixed(0)}m). FUERA DE ZONA DE OBRA.`);
          }
        }
      );
      
      return () => {
        if (listener) {
          listener.remove();
        }
      };
    })();
  }, []);

  const handleFichaje = async (tipo_fichaje) => {
    if (!location) {
      Alert.alert('Error', 'Esperando ubicación GPS. Intente de nuevo.');
      return;
    }
    
    const dist = distancia(
      location.coords.latitude,
      location.coords.longitude,
      ZONA_AUTORIZADA.lat,
      ZONA_AUTORIZADA.lon
    );
    
    const fueraDeZona = dist > ZONA_AUTORIZADA.radio;

    if (fueraDeZona) {
      Alert.alert('Advertencia de Geo-cerca', 'Usted está fuera del área autorizada. El registro se hará, pero será marcado como FUERA DE ZONA.', [
        { text: 'OK' }
      ]);
    }
    
    setLoading(true);

    const payload = {
      empleado_id: user.email, // Usamos el email autenticado como ID
      tipo_fichaje: tipo_fichaje,
      actividad: actividad,
      latitud: location.coords.latitude,
      longitud: location.coords.longitude,
      timestamp_servidor: new Date().toISOString(), 
      fuera_de_zona: fueraDeZona, 
    };

    try {
      // GUARDAR DATOS EN REALTIME DATABASE
      const fichajesRef = ref(dbRTDB, 'fichajes');
      await push(fichajesRef, payload);

      Alert.alert('Fichaje Exitoso', 
        `¡${tipo_fichaje} registrado!\nID: ${user.email}`, 
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error("Error al escribir en Realtime Database: ", error);
      Alert.alert('Error de Conexión a Firebase', 
        'No se pudo guardar el registro. Verifique su conexión y las reglas de seguridad de Realtime Database.', 
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  if (errorMsg) {
    return <View style={styles.container}><Text style={styles.errorText}>Error de Permisos: {errorMsg}</Text></View>;
  }


  return (
    <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoutContainer}>
            <Text style={styles.loggedInAs}>Fichando como: {user.email}</Text>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <Text style={styles.logoutText}>Salir</Text>
            </TouchableOpacity>
        </View>

      <Text style={styles.header}>Control de Fichaje</Text>
      
      <Text style={styles.label}>Email/ID de Empleado:</Text>
      <TextInput
        style={[styles.input, { backgroundColor: '#e0e0e0' }]}
        value={empleadoId}
        editable={false}
      />
      
      <Text style={styles.label}>Actividad/Obra:</Text>
      <TextInput
        style={styles.input}
        onChangeText={setActividad}
        value={actividad}
        placeholder="Ingrese la obra o actividad actual"
      />

      {loading && (
        <ActivityIndicator size="large" color="#1e3a8a" style={{ marginVertical: 20 }} />
      )}

      <View style={styles.buttonContainer}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Button
            title="FICHAJE ENTRADA"
            onPress={() => handleFichaje('ENTRADA')}
            color="#10b981"
            disabled={loading || !location}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Button
            title="FICHAJE SALIDA"
            onPress={() => handleFichaje('SALIDA')}
            color="#ef4444"
            disabled={loading || !location}
          />
        </View>
      </View>
      
      <View style={styles.statusBox}>
        <Text style={styles.statusTitle}>Estado del GPS:</Text>
        <Text style={styles.statusText}>ESTADO: {mensajeEstado}</Text>
        {ultimaCoordenada && (
            <Text style={styles.statusCoords}>
                Última Lat/Lon: {ultimaCoordenada.lat.toFixed(4)}, {ultimaCoordenada.lon.toFixed(4)}
            </Text>
        )}
        <Text style={styles.statusText}>Frente Autorizado (Ejemplo): {ZONA_AUTORIZADA.lat}, {ZONA_AUTORIZADA.lon} ({ZONA_AUTORIZADA.radio}m)</Text>
      </View>
    </ScrollView>
  );
};


// ==========================================================
// PANTALLA DE LOGIN
// ==========================================================

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [loginError, setLoginError] = useState(null);

    const handleLogin = async () => {
        setLoading(true);
        setLoginError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Error de Login:", error.code);
            let message = "Error desconocido de autenticación.";
            if (error.code === 'auth/invalid-email') {
                message = "Formato de email incorrecto.";
            } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                message = "Usuario o contraseña incorrectos.";
            } else if (error.code === 'auth/too-many-requests') {
                 message = "Demasiados intentos fallidos. Intente más tarde.";
            }
            setLoginError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            style={styles.loginContainer}
        >
            <View style={styles.loginCard}>
                <Text style={styles.header}>ACCESO DE EMPLEADOS</Text>
                
                <Text style={styles.label}>Email/ID de Empleado</Text>
                <TextInput
                    style={styles.input}
                    placeholder="ej: empleado@consorcio.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <Text style={styles.label}>Contraseña</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Contraseña"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                {loginError && (
                    <Text style={styles.loginErrorText}>{loginError}</Text>
                )}

                <Button
                    title={loading ? "Verificando..." : "INICIAR SESIÓN"}
                    onPress={handleLogin}
                    color="#1e3a8a"
                    disabled={loading || !email || !password}
                />
            </View>
        </KeyboardAvoidingView>
    );
};

// ==========================================================
// COMPONENTE PRINCIPAL (Maneja el Estado de Autenticación)
// ==========================================================

export default function App() {
    const [user, setUser] = useState(null); 
    const [authReady, setAuthReady] = useState(false); 
    
    // Auth Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthReady(true);
        });
        return unsubscribe; // Cleanup subscription
    }, []);

    const handleLogout = () => {
        signOut(auth).catch(error => {
            Alert.alert("Error al salir", "No se pudo cerrar la sesión.");
            console.error(error);
        });
    };

    if (!authReady) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color="#1e3a8a" />
                <Text style={styles.loadingText}>Cargando autenticación...</Text>
            </View>
        );
    }

    if (!user) {
        return <LoginScreen />;
    }

    // Si el usuario está autenticado, muestra la pantalla de fichaje
    return <FichajeScreen user={user} handleLogout={handleLogout} />;
}


// ==========================================================
// ESTILOS COMPARTIDOS
// ==========================================================

const styles = StyleSheet.create({
  // Estilos compartidos por Login y Fichaje
  container: {
    flexGrow: 1,
    padding: 25,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
    color: '#1e3a8a',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 5,
    color: '#374151',
  },
  input: {
    height: 48,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  
  // Estilos específicos de Fichaje
  logoutContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  loggedInAs: {
      fontSize: 14,
      color: '#555',
      fontWeight: '600',
  },
  logoutButton: {
      backgroundColor: '#f87171',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 5,
  },
  logoutText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 40,
  },
  statusBox: {
    padding: 15,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderLeftWidth: 5,
    borderLeftColor: '#3b82f6',
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1e3a8a',
  },
  statusText: {
    fontSize: 13,
    color: '#4b5563',
  },
  statusCoords: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#059669',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#1e3a8a',
  },

  // Estilos específicos de Login
  loginContainer: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    justifyContent: 'center',
    padding: 20,
  },
  loginCard: {
      backgroundColor: 'white',
      padding: 30,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 6,
  },
  loginErrorText: {
      color: '#dc2626',
      textAlign: 'center',
      marginBottom: 10,
      fontWeight: '600',
  }
});