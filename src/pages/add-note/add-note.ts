import { Note } from './../../models/note';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';



@IonicPage()
@Component({
  selector: 'page-add-note',
  templateUrl: 'add-note.html',
})
export class AddNotePage {
  
  public form: FormGroup
  notes: Note
  note: any
  title: string


  constructor(public navCtrl: NavController, public navParams: NavParams) {
    
    this.note = this.navParams.data.note || { };
    
    this.form = new FormGroup({
      title: new FormControl(''),
      description: new FormControl(''),
      expiring_date: new FormControl(''),
      created_at: new FormControl('')
    })

    this.title = this.note.id? 'Editar Nota' : 'Adicionar Nota'
  }



  onSubmit() {
    console.log(this.form.value)
    this.form.value.created_at = new Date().toISOString()
    if (this.note.id){
      Note.update(this.note.id, this.form.value)
    }else{
      Note.add(this.form.value)
    }
    this.navCtrl.pop()
  }

  remove(){
    Note.remove(this.note.id)
    this.navCtrl.pop()
  }


}
