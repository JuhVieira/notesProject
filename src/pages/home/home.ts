import { Note } from './../../models/note';
import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController } from 'ionic-angular';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  notes: any
  date: any
  constructor(public navCtrl: NavController, public navParams: NavParams, public loadingCtrl: LoadingController) {
  
  }
  
  

  ionViewDidLoad(){
    this.date = new Date().toISOString()
    let loading = this.loadingCtrl.create({
      spinner: 'hide',
      content: 'Please wait...'
    })
    loading.present();
    
    this.notes = Note.list()

    loading.dismiss()
  }

 

  onAddPage(note: any){
    this.navCtrl.push('AddNotePage', { note: note })
  }



}
