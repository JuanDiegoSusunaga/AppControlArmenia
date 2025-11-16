import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  Button, 
  Alert, 
  ActivityIndicator, 
  ScrollView 
} from 'react-native';
import * as Location from 'expo-location';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDM4HvPGHme9UTKiAxGgNuZJX_a5BUBtu4",
  authDomain: "controldeobranexus.firebaseapp.com",
  projectId: "controldeobranexus",
  storageBucket: "controldeobranexus.firebasestorage.app",
  messagingSenderId: "382485340614",
  appId: "1:382485340614:web:81f3e28baca08c57b412c7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Configuración de Geo-Cerca ---
const ZONA_AUTORIZADA = {
  lat: 4.533000, 
  lon: -75.675000,
  radio: 200, 
};

// Función Haversine para calcular la distancia en metros
const distancia = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; 
  const toRad = v => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};


function App() {
  const [empleadoId, setEmpleadoId] = useState('EMP-987');
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
      empleado_id: empleadoId,
      tipo_fichaje: tipo_fichaje,
      actividad: actividad,
      latitud: location.coords.latitude,
      longitud: location.coords.longitude,
      timestamp_cliente: new Date().toISOString(),
      fuera_de_zona: fueraDeZona, // Nuevo campo para auditoría
    };

    try {
      // 🚨 GUARDAR DATOS DIRECTAMENTE EN FIRESTORE 🚨
      await addDoc(collection(db, "fichajes"), payload);

      Alert.alert('Fichaje Exitoso', 
        `¡${tipo_fichaje} registrado!\nID: ${empleadoId}`, 
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error("Error al escribir en Firestore: ", error);
      Alert.alert('Error de Conexión a Firebase', 
        'No se pudo guardar el registro. Verifique su conexión y las reglas de seguridad de Firestore.', 
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
      <Text style={styles.header}>Control de Fichaje (Conexión a Firestore)</Text>
      
      <Text style={styles.label}>ID de Empleado:</Text>
      <TextInput
        style={styles.input}
        onChangeText={setEmpleadoId}
        value={empleadoId}
        placeholder="Ingrese su ID de empleado"
      />
      
      <Text style={styles.label}>Actividad/Obra:</Text>
      <TextInput
        style={styles.input}
        onChangeText={setActividad}
        value={actividad}
        placeholder="Ingrese la obra o actividad actual"
      />

      {loading && (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginVertical: 20 }} />
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
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
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
});

export default App;