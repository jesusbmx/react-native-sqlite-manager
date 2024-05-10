import React, { useEffect, useState } from "react"
import { ScrollView, View } from "react-native";
import { Appbar, List } from "react-native-paper";
import { format as dateFormat } from 'date-fns';

import Animal from "../model/Animal";
import { notifyEvent } from "react-native-event-manager";

function AnimalDetailsScreen({navigation, route}: any): JSX.Element {

  const { id } = route.params;

  const [animal, setAnimal] = useState<Animal>(new Animal())

  useEffect(() => {
    Animal.find<Animal>(id).then(row => {
      setAnimal(row!);
    })
    .catch((err) => console.debug(err));

  }, [id]);

  const handleDelete = () => {
    Animal.destroy(id).then(() => {
      notifyEvent('Animal.onUpdate')
      
      navigation.goBack()
    })
    .catch((err) => console.debug(err));
  }

  const handleEdit = () => {
    navigation.navigate('AnimalFormScreen', {
      id: id
    })
  }

  return (
    <View>
      { /* AppBar Header */}
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={"Detalles"} />
        <Appbar.Action icon="delete" onPress={handleDelete} />
        <Appbar.Action icon="pencil" onPress={handleEdit} />
      </Appbar.Header>

      <ScrollView>
        <View>
          <List.Item
            title="ID"
            description={animal.id}
          />
          <List.Item
            title="Name"
            description={animal.name}
          /> 
          <List.Item
            title="Color"
            description={animal.color}
          /> 
          <List.Item
            title="Age"
            description={animal.age}
          />   
          { animal.timestamp &&
            <List.Item
              title="Timestamp"
              description={dateFormat(animal.timestamp, 'yyyy-MM-dd  hh:mm a')}
            />
          }          
        </View>
      </ScrollView>
    </View>
  );
}

export default AnimalDetailsScreen
