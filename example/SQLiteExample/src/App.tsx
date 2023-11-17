import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Provider as PaperProvider } from 'react-native-paper';
import { DB } from 'react-native-sqlite-manager';

import Scheme from './db/Scheme';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    setLoading(true)

    // We get a database instance by name. 
    const db = DB.get(/*database name*/"example.db")

    // Initialize the database schema.
    db.init(new Scheme(), /*database version*/ 1).then(() => {
      setLoading(false)
    })

  }, []);

  if (loading) {
    return (
      <ActivityIndicator 
        animating={true} 
        size='large' 
        style={{flex: 1}}
      />
    )
  }

  return (
    <PaperProvider>
      <AppNavigator/>
    </PaperProvider>
  );
}

