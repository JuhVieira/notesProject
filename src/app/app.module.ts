import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { AngularFireModule } from 'angularfire2';
import { AngularFirestoreModule } from 'angularfire2/firestore';
import * as firebase from 'firebase';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';

const FIREBASECONFIG = {
  apiKey: "AIzaSyDLL5Mj1n-6YwR07dBAhf5WD-XMHbilv4o",
  authDomain: "savenotes-f3d96.firebaseapp.com",
  databaseURL: "https://savenotes-f3d96.firebaseio.com",
  projectId: "savenotes-f3d96",
  storageBucket: "savenotes-f3d96.appspot.com",
  messagingSenderId: "482137638034"
};

firebase.initializeApp(FIREBASECONFIG)

@NgModule({
  declarations: [
    MyApp,
    HomePage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    AngularFireModule.initializeApp(FIREBASECONFIG),
    AngularFirestoreModule,
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    { provide: ErrorHandler, useClass: IonicErrorHandler }
  ]
})
export class AppModule { }
