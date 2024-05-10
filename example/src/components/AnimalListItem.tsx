import React from 'react'
import { List } from 'react-native-paper'
import Animal from '../model/Animal';

export type Props = {
  item: Animal;
  onPress: (item: Animal) => void;
}

function AnimalListItem(props: Props): JSX.Element {
  
  const { item, onPress } = props;

  return(
    <List.Item
      title={item.name}
      description={`Age: ${item.age} Color: ${item.color}`}
      left={props => <List.Icon {...props} icon="paw" />}
      onPress={() => onPress(item)}
    />
  )
}

export default AnimalListItem