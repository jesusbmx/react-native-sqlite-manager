import React, { useState, useEffect } from "react";
import { FlatList, View } from 'react-native'
import { Appbar } from 'react-native-paper'
import { useOnEvent } from "react-native-event-manager";

import Animal from "../model/Animal";
import AnimalListItem from "./AnimalListItem";

function AnimalListScreen({navigation, route}: any): JSX.Element {
    const [items, setItems] = useState<Animal[]>([])
  
    useEffect(() => {
      updateList();
    }, [])
  
    const updateList = () => {
      Animal.all<Animal>().then(rows => {
        setItems(rows)
      }).catch(error => {
        console.error(error)
      })
    }
  
    // Cuando se modifica un registro
    useOnEvent('Animal.onUpdate', updateList)
  
    const handleOnPressItem = (item: Animal) => {
      item.print()
      navigation.navigate("AnimalDetailsScreen", {
        id: item.id,
      })
    }

    const handleAdd = () => {
      navigation.navigate("AnimalFormScreen")
    }

    // render
    return (
      <View>
        { /* AppBar Header */}
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={"Animals"} />
          <Appbar.Action icon='plus' onPress={handleAdd} />
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