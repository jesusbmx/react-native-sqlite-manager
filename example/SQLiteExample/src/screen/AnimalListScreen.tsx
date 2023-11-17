import React, { useState, useEffect } from "react";
import { FlatList, View } from 'react-native'
import { Appbar } from 'react-native-paper'
import { useOnEvent } from "react-native-event-manager";

import Animal from "../model/Animal";
import AnimalListItem from "../components/AnimalListItem";

function AnimalListScreen({navigation, route}: any): JSX.Element {
    const [items, setItems] = useState<any[]>([])
  
    // Gancho que se ejecuta cuando cambie de estado "searchQuery"
    useEffect(() => {
      updateList();
    }, [])
  
    // Actualiza la lista
    const updateList = () => {
      Animal.all().then(rows => {
        console.debug(rows)
        setItems(rows)
      }).catch(error => {
        console.error(error)
      })
    }
  
    // Cuando se modifica un registro
    useOnEvent('Animal.onUpdate', updateList)
  
    // Muestra los detalles del registro
    const handleOnPressItem = (item: any) => {
      navigation.navigate("AnimalDetailsScreen", {
        id: item.id,
      })
    }

    // render
    return (
      <View>
        { /* AppBar Header */}
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={"Animals"} />
        </Appbar.Header>

        { /* Lista de registros */ }
        <FlatList
          data={items}
          renderItem={({item}) => (
            <AnimalListItem 
              item={item}
              onPress={handleOnPressItem}
            />
          )}
        />
  
      </View>
    );
}

export default AnimalListScreen