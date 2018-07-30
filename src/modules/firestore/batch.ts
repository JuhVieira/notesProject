import { firestore } from 'firebase'
import { CollectionRelationship, RelationshipType } from "./collection-relationship"
import { Observable } from 'rxjs/Observable'
import { CascadeRelationship } from './collection';

export class Batch {
    public write_batch: firestore.WriteBatch = firestore().batch();

    /**
     * Adicionar um novo relacionamento no batch atual
     * @param relationship Relacionamento
     * @param id_primary Id primário
     * @param id_secondary Id secundário
     * @param obj Objeto extra do relacionamento
     */
    public add_relationship(relationship: CollectionRelationship<any, any>,
        id_primary: string,
        id_secondary: string,
        obj?: any): Batch {

        switch (relationship.type) {
            case RelationshipType.ManyToMany:
                return this.add_many_to_many(relationship, id_primary, id_secondary, obj)
            case RelationshipType.OneToOne:
                return this.add_one_to_one(relationship, id_primary, id_secondary, obj)
            case RelationshipType.OneToMany:
                return this.add_one_to_many(relationship, id_primary, id_secondary, obj)
            default:
                throw Error("Adicionado um relacionamento que não possui tipo válido")
        }
    }

    /**
     * Remover um relacionamento no batch atual
     * @param relationship Relacionamento
     * @param id_primary Id primário
     * @param id_secondary Id secundário
     */
    public remove_relationship(relationship: CollectionRelationship<any, any>,
        id_primary: string,
        id_secondary: string): Batch {

        switch (relationship.type) {
            case RelationshipType.ManyToMany:
                return this.remove_many_to_many(relationship, id_primary, id_secondary)
            case RelationshipType.OneToOne:
                return this.remove_one_to_one(relationship, id_primary, id_secondary)
            case RelationshipType.OneToMany:
                return this.remove_one_to_many(relationship, id_primary, id_secondary)
            default:
                throw Error("Removendo um relacionamento que não possui tipo válido")
        }
    }

    /**
     * Adiciona/Remove uma lista de relacionamentos no batch atual baseado em uma entidade primária e seu ID.
     * @param cascade_relationships Lista de relacionamentos em cascata
     * @param id_primary Id primário
     */
    public cascade(cascade_relationships: CascadeRelationship[], id_primary: string): Batch {
        // TODO: Relacionamento em cascata
        for (let cascade_relationship of cascade_relationships) {
            // Foi removido e adicionado o mesmo relacionamento
            // Então pular essa operação
            if (cascade_relationship.removeId &&
                cascade_relationship.id &&
                cascade_relationship.id === cascade_relationship.removeId)
                continue

            if (cascade_relationship.removeId)
                this.remove_relationship(cascade_relationship.relationship, id_primary, cascade_relationship.removeId)
            if (cascade_relationship.id)
                this.add_relationship(cascade_relationship.relationship, id_primary, cascade_relationship.id)
        }
        return this
    }

    /**
     * Adiciona um update de um relacionamento de um para muitos.
     * @param relationship Características do relacionamento
     * @param id_primary Id primário
     * @param id_secondary Id secundário
     * @param obj Objeto que será adicionado em ambas as partes
     */
    public add_one_to_many(relationship: CollectionRelationship<any, any>,
        id_primary: string,
        id_secondary: string,
        obj?: any): Batch {

        obj = obj || { created: new Date() }

        // Se o primary for igual ao collection 2
        // Dar swap nas chaves
        // Para sempre o "id_primary" se referir a id da collection1 que é One
        // E o "id_secondary" se referir a id da collection2 que é Many
        if (relationship.primary.collection == relationship.collection2.collection) {
            let temp = id_primary
            id_primary = id_secondary
            id_secondary = temp
        }

        let reference: firestore.DocumentReference = firestore()
            .collection(relationship.collection2.collection.path)
            .doc(id_secondary)

        let update = {}

        obj.id = id_primary
        update[relationship.collection1.name] = obj
        this.write_batch.set(reference, update, { merge: true })

        return this
    }

    /**
     * Remove um relacionamento de um para muitos.
     * @param relationship Características do relacionamento
     * @param id_primary Id primário
     * @param id_secondary Id secundário
     */
    public remove_one_to_many(relationship: CollectionRelationship<any, any>,
        id_primary: string,
        id_secondary: string): Batch {

        // Se o primary for igual ao collection 2
        // Dar swap nas chaves
        // Para sempre o "id_primary" se referir a id da collection1 que é One
        // E o "id_secondary" se referir a id da collection2 que é Many
        if (relationship.primary.collection == relationship.collection2.collection) {
            let temp = id_primary
            id_primary = id_secondary
            id_secondary = temp
        }

        let reference: firestore.DocumentReference = firestore()
            .collection(relationship.collection2.collection.path)
            .doc(id_secondary)

        let update = {}
        update[relationship.collection1.name] = null
        this.write_batch.set(reference, update, { merge: true })

        return this
    }

    /**
     * Adiciona um update de um relacionamento de muitos para muitos.
     * @param relationship Características do relacionamento
     * @param id_primary Id primário
     * @param id_secondary Id secundário
     * @param obj Objeto que será adicionado em ambas as partes
     */
    public add_many_to_many(relationship: CollectionRelationship<any, any>,
        id_primary: string,
        id_secondary: string,
        obj?: any): Batch {

        obj = obj || { created: new Date() }

        let relation1: firestore.DocumentReference = firestore()
            .collection(relationship.primary.collection.path)
            .doc(id_primary)
            .collection(relationship.secondary.name)
            .doc(id_secondary)

        let relation2: firestore.DocumentReference = firestore()
            .collection(relationship.secondary.collection.path)
            .doc(id_secondary)
            .collection(relationship.primary.name)
            .doc(id_primary)

        this.write_batch.set(relation1, obj)
        this.write_batch.set(relation2, obj)

        return this
    }

    /**
     * Remove um relacionamento de muitos para muitos.
     * @param relationship Características do relacionamento
     * @param id_primary Id primário
     * @param id_secondary Id secundário
     */
    public remove_many_to_many(relationship: CollectionRelationship<any, any>,
        id_primary: string,
        id_secondary: string): Batch {

        let relation1: firestore.DocumentReference = firestore()
            .collection(relationship.primary.collection.path)
            .doc(id_primary)
            .collection(relationship.secondary.name)
            .doc(id_secondary)

        let relation2: firestore.DocumentReference = firestore()
            .collection(relationship.secondary.collection.path)
            .doc(id_secondary)
            .collection(relationship.primary.name)
            .doc(id_primary)

        this.write_batch.delete(relation1)
        this.write_batch.delete(relation2)

        return this
    }

    /**
     * Adicona um update de um relacionamento de um para um
     * @param relationship Características do relacionamento
     * @param id_primary Id primário
     * @param id_secondary Id secundário
     * @param obj Objeto que será adicionado em ambas as partes
     */
    public add_one_to_one(relationship: CollectionRelationship<any, any>,
        id_primary: string,
        id_secondary: string,
        obj?: any) {
        obj = obj || { created: new Date() }

        let reference1: firestore.DocumentReference = firestore()
            .collection(relationship.primary.collection.path)
            .doc(id_primary)


        let reference2: firestore.DocumentReference = firestore()
            .collection(relationship.secondary.collection.path)
            .doc(id_secondary)

        let update = {}

        obj.id = id_secondary
        update[relationship.secondary.name] = obj
        this.write_batch.set(reference1, update, { merge: true })

        obj.id = id_primary
        update = {};
        update[relationship.primary.name] = obj
        this.write_batch.set(reference2, update, { merge: true })

        return this
    }

    /**
     * Remove um relacionamento de um para um
     * @param relationship Características do relacionamento
     * @param id_primary Id primário
     * @param id_secondary Id secundário
     * @param obj Objeto que será adicionado em ambas as partes
     */
    public remove_one_to_one(relationship: CollectionRelationship<any, any>,
        id_primary: string,
        id_secondary: string) {

        let reference1: firestore.DocumentReference = firestore()
            .collection(relationship.primary.collection.path)
            .doc(id_primary)


        let reference2: firestore.DocumentReference = firestore()
            .collection(relationship.secondary.collection.path)
            .doc(id_secondary)

        let update = {}
        update[relationship.secondary.name] = null
        this.write_batch.set(reference1, update, { merge: true })

        update = {};
        update[relationship.primary.name] = null
        this.write_batch.set(reference2, update, { merge: true })

        return this
    }

    /**
     * Executar as mudanças
     */
    public commit(): Observable<void> {
        return Observable.fromPromise(this.write_batch.commit())
    }
}