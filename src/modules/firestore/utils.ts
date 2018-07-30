import { firestore } from 'firebase'

/**
 * Retira todos os meta dados do DocumentSnapshot.
 * A partir de um document snapshot, retira as informações do documento
 * e coloca o atributo ID dentro dessas informações.
 * Retorna essa informação
 * @param document document Snapshot do firestore
 * @returns Um objeto qualquer com um atributo ID do tipo string
 */
export function fromDocumentSnapshot(document: firestore.DocumentSnapshot): any & { id: string } {
    if (!document.exists) return null
    let obj: any = document.data()
    obj.id = document.id
    return obj
}

/**
 * Retira todos os meta dados do QuerySnapshot(resultado da consulta, que possui um array de DocumentSnapshots).
 * A partir de um querySnapshot, retira as informações, e adiciona o atributo ID em cada uma das informações.
 * Retorna essas informações(array)
 * @param query Query Snapshot do firestore
 * @returns Um array onde cada elemento possui um ID
 */
export function fromQuerySnapshot(query: firestore.QuerySnapshot): (any & { id: string })[] {
    return query.docs.map((d: firestore.DocumentSnapshot) => {
        if (!d.exists) return null
        let obj: any = d.data()
        obj.id = d.id
        return obj
    })
}