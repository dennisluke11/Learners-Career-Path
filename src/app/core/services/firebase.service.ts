import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore, collection, doc, getDoc, getDocs, query, where, QuerySnapshot, DocumentSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { environment } from '../../../environments/environment';
import { LoggingService } from './logging.service';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private app: FirebaseApp | null = null;
  private db: Firestore | null = null;

  constructor(private loggingService: LoggingService) {
    if (environment.firebaseConfig && environment.firebaseConfig.apiKey) {
      this.initializeFirebase();
    }
  }

  private initializeFirebase() {
    try {
      if (getApps().length === 0) {
        this.app = initializeApp(environment.firebaseConfig);
      } else {
        this.app = getApp();
      }
      this.db = getFirestore(this.app);
    } catch (error) {
      this.loggingService.error('Firebase initialization error', error);
    }
  }

  isAvailable(): boolean {
    return this.db !== null;
  }

  async getDocument(collectionName: string, documentId: string): Promise<any | null> {
    if (!this.db) {
      this.loggingService.warn('Firebase not initialized, returning null');
      return null;
    }

    try {
      const docRef = doc(this.db, collectionName, documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      this.loggingService.error(`Error fetching document ${documentId} from ${collectionName}`, error);
      return null;
    }
  }

  async getCollection(collectionName: string): Promise<any[]> {
    if (!this.db) {
      this.loggingService.warn('Firebase not initialized, returning empty array');
      return [];
    }

    try {
      const querySnapshot = await getDocs(collection(this.db, collectionName));
      return querySnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      this.loggingService.error(`Error fetching collection ${collectionName}`, error);
      return [];
    }
  }

  async getCollectionWhere(collectionName: string, field: string, operator: any, value: any): Promise<any[]> {
    if (!this.db) {
      this.loggingService.warn('Firebase not initialized, returning empty array');
      return [];
    }

    try {
      const q = query(collection(this.db, collectionName), where(field, operator, value));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      this.loggingService.error(`Error fetching filtered collection ${collectionName}`, error);
      return [];
    }
  }

  async addDocument(collectionName: string, data: any): Promise<string | null> {
    if (!this.db) {
      this.loggingService.warn('Firebase not initialized, cannot add document');
      return null;
    }

    try {
      const docRef = await addDoc(collection(this.db, collectionName), {
        ...data,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      this.loggingService.error(`Error adding document to ${collectionName}`, error);
      return null;
    }
  }
}

