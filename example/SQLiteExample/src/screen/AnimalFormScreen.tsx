import { useEffect } from "react";
import { ScrollView, View } from "react-native";
import { Appbar, HelperText, TextInput } from "react-native-paper";

import { useFormik } from "formik";
import * as Yup from 'yup'

import Animal from "../model/Animal";
import { notifyEvent } from "react-native-event-manager";

function AnimalFormScreen({navigation, route}: any): JSX.Element {

  const { id } = route.params ?? {};

  const isEdit = id > 0;

  useEffect(() => {
    if (isEdit) {
      // get record and set form fields
      Animal.find(id).then(row => {
        form.setValues(row);
      })
      .catch((err) => console.debug(err));
    } 
  }, [id]);

  const onSubmit = (data: any) => {
    const animal = new Animal({
      id: isEdit ? id : undefined,
      name: data.name,
      color: data.color,
      age: data.age,
      timestamp: Date.now(),
    })
    
    animal.save()
      .then((record) => {
        notifyEvent('Animal.onUpdate');
        navigation.goBack();      
      })
      .catch(error => {
        console.error(error)
      })
  }

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .required("The name field is required")
    ,
    color: Yup.string()
      .required("The color field is required")
    ,
    age: Yup.number()
      .required("the age field is required")
      .min(1, "The Age must be at least 1")
    ,
  })


  const form = useFormik<any>({
    initialValues: { 
    },
    onSubmit: onSubmit,
    validationSchema: validationSchema,
    validateOnBlur: false,
    validateOnMount: false,
    validateOnChange: false,
  });

  return(
    <View>
      { /* AppBar Header */}
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={"Precios"} />
        <Appbar.Action icon="content-save" onPress={() => form.handleSubmit()}/>
      </Appbar.Header>

      <ScrollView style={{padding: 14}}>
        { /* pricePerHour */}
        <View>
          <TextInput
            mode="outlined"
            label="Name"
            value={form.values.name}
            onChangeText={form.handleChange('name')}
          />
          <HelperText visible={form.errors.name != undefined} type="error">
            { form.errors.name?.toString() }
          </HelperText>

          <TextInput
            mode="outlined"
            label="Color"
            value={form.values.color}
            onChangeText={form.handleChange('color')}
          />
          <HelperText visible={form.errors.color != undefined} type="error">
            { form.errors.color?.toString() }
          </HelperText>

          <TextInput
            mode="outlined"
            label="Age"
            keyboardType="decimal-pad"
            value={form.values.age?.toString()}
            onChangeText={form.handleChange('age')}
          />
          <HelperText visible={form.errors.age != undefined} type="error">
            { form.errors.age?.toString() }
          </HelperText>
        </View>
      </ScrollView>
    </View>
  )
}

export default AnimalFormScreen
