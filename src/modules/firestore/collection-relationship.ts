import { Batch } from './batch';
import { Collection, OrderQuery, WhereQuery } from './collection';
import { firestore } from 'firebase';
import * as Rx from 'rxjs';
import 'rxjs/add/operator/catch';
import { Observable } from 'rxjs/Observable';

/**
 * T representa o tipo da entidade secundária. No qual o list() retornaria
 * R representa os atributos extras do relacionamento. São os complementos do RelationshipField
 */
export class CollectionRelationship<T, R> {

    /**
     * Primeira collection do relacionamento
     */
    public get collection1(): RelationshipProperties {
        throw Error('Função collection1() não foi sobrescrita no relacionamento')
    }

    /**
     * Segunda collection do relacionamento
     */
    public get collection2(): RelationshipProperties {
        throw Error("Função collection2() não foi sobrescrita no relacionamento")
    }

    /**
     * Tipo do relacionamento
     */
    public type: RelationshipType //type pode ser '11', 'nn', '1n'

    /**
     * Se o relacionamento é bidirecional ou não
     */
    public bidirectional: boolean

    /**
     * Calcula quem é o relacionamento primário a partir de quem está o chamando.
     */
    public get primary(): RelationshipProperties {
        if (this._primary != this.collection1.collection && this._primary != this.collection2.collection) {
            throw Error("Foi inicializado um relacionamento com uma entidade não existente no relacionamento")
        }
        if (this._primary === this.collection1.collection) {
            return this.collection1
        } else {
            return this.collection2
        }
    }

    /**
     * Calcula quem é o relacionamento secundário a partir de quem está o chamando.
     */
    public get secondary(): RelationshipProperties {
        if (this._primary === this.collection1.collection) {
            return this.collection2
        } else {
            return this.collection1
        }
    }

    /**
     * Recebe uma lista de objetos que possuem os atributos de "RelationshipField",
     * E talvez outros atributos extras dependendo das definições do Relacionamento
     * @param id_primary Id da entidade
     * @param where Array de condições que serão utilizados na consulta
     * @param order Define como será a ordenação dos elementos consultados
     * @param limit Define o número máximo de elementos retornados
     * @param not_realtime Se true, a consulta não será em tempo real
     */
    public listRelation(id_primary: string, where?: WhereQuery[], order?: OrderQuery[], limit?: number, not_realtime?: boolean): Observable<(R & RelationshipField)[]> {
        if (order) throw Error("Many To Many não tem como ordenar")
        if (this.type === RelationshipType.OneToMany || this.type === RelationshipType.OneToOne) {
            throw Error("listRelation chamado com tipo inválido. Apenas Many To Many permitido")
        }

        let relation: firestore.CollectionReference = firestore()
            .collection(this.primary.collection.path)
            .doc(id_primary)
            .collection(this.secondary.name)

        return Collection.request_list(relation, where, order, limit, not_realtime)
    }

    /**
     * Recebe uma lista de elementos da collection secundária a partir do id da primária.
     * As especificações de where e order são utilizadas para especificar a consulta
     * Relacionamento One To Many: Utiliza where e order nos objetos do relacionamento One
     * Relacionamento Many To Many: Utiliza where e order nos valores do relacionamento apenas.
     * @param id_primary Id da entidade
     * @param where Array de condições que serão utilizados na consulta
     * @param order Define como será a ordenação dos elementos consultados
     * @param limit Define o número máximo de elementos retornados
     * @param not_realtime Se true, a consulta não será em tempo real
     */
    public list(id_primary: string, where?: WhereQuery[], order?: OrderQuery[], limit?: number, not_realtime?: boolean): Observable<T[]> {
        switch (this.type) {
            case RelationshipType.OneToOne:
                throw Error("Não existe lista em relacionamentos One to One")
            case RelationshipType.OneToMany:
                return this.listOneToMany(id_primary, where, order, limit, not_realtime)
            case RelationshipType.ManyToMany:
                return this.listRelation(id_primary, where, order, limit, not_realtime)
                    .map(objs => objs.map(obj => obj.id))
                    // Transformar a lista de chaves em uma lista de observables para requisitar as informações dos ID
                    .map((keys: string[]) => {
                        return keys.map(key => {
                            return this.secondary.collection.object(key)
                        })
                    })
                    // Executar a lista de observables
                    .flatMap((objs$: Observable<any>[]) => {
                        return objs$.length <= 0 ? Observable.of([]) : Observable.combineLatest(objs$)
                    })
                    // Caso algum ID faça referência a um objeto que não existe mais, retirar da lista
                    .map((objs: T[]) => {
                        return objs.filter((obj) => {
                            if (obj) return true
                            // Se o obj é null ou undefined gerar um warn(poderá ser tratado depois)
                            console.warn("Id faz referência a um objeto que não existe mais")
                            return false
                        })
                    });
            default:
                throw Error("Tipo inválido")
        }
    }

    /**
     * Verifica se existe um id de um documento específico em uma coleção
     * @param id_primary Id do objeto no qual será obtido a lista de keys da relação
     * @param id_secondary Id a ser buscado na lista de keys
     * @return retorna um Observble boolean que diz se foi ou não encontrado o id_secondary
     */
    public exist(id_primary: string, id_secondary: string) {

        return this.listRelation(id_primary)
            .map(objs => objs.map(obj => obj.id))
            .flatMap((keys: string[]) => {
                if (elementIsInsideArray(id_secondary, keys)) {
                    return Observable.of(true);
                }
                else {
                    return Observable.of(false);
                }
            })

    }

    /**
     * Adiciona uma conexão entre duas collections
     * @param id_primary Id da collection primária(aquela que está chamando o relacionamento)
     * @param id_secondary Id da collection secundária(aquela que não está chamando o relacionamento)
     * @param obj Objeto a ser atualizado
     */
    public add(id_primary: string, id_secondary: string, obj?: R): Observable<void | {}> {
        let batch: Batch = new Batch()
        batch.add_relationship(this, id_primary, id_secondary, obj)
        return batch.commit()
    }

    /**
     * Remove uma conexão entre duas collections
     * @param id_primary Id da collection primária(aquela que está chamando o relacionamento)
     * @param id_secondary Id da collection secundária(aquela que não está chamando o relacionamento)
     */
    public remove(id_primary: string, id_secondary: string): Observable<void | {}> {
        let batch: Batch = new Batch()
        batch.remove_relationship(this, id_primary, id_secondary)
        return batch.commit()
    }

    constructor(private _primary: typeof Collection) { }


    /**
     * collection 1 - One. collection 2 - Many
     * Lista os elementos fazendo uma query na collection 2 para ver quais possuem o ID da collection 1.
     * @param id_primary Id da relacão primária que possui deve ser do lado One do relacionamento OneToMany
     * @param where Array de condições que serão utilizados na consulta
     * @param order Define como será a ordenação dos elementos consultados
     * @param limit Define o número máximo de elementos retornados
     * @param not_realtime Se true, a consulta não será em tempo real
     */
    private listOneToMany(id_primary: string, where?: WhereQuery[], order?: OrderQuery[], limit?: number, not_realtime?: boolean): Observable<T[]> {
        if (this.collection1.collection !== this.primary.collection) {
            throw Error("Uso invalido da função list. Apenas pode listar com o id da collection1 que é One. Deve-se usar a outra entidade para listar.")
        }

        if (!where)
            where = []

        where.push({
            name: `${this.collection1.name}.id`,
            operator: "==",
            value: id_primary
        })

        return this.collection2.collection.list(where, order, limit, not_realtime)
    }
}

/**
 * Tipos possíveis de relacionamento
 */
export enum RelationshipType {
    OneToOne,
    ManyToMany,
    OneToMany
}

/**
 * Propriedades de uma collection do relacionamento
 */
export interface RelationshipProperties {
    collection: typeof Collection
    name: string
    required: boolean
}

/**
 * Objeto que representa uma relacionamento para um.
 * Contido em ambos os lados no OneToOne
 * Contido em apenas um dos lados no OneToMany
 */
export interface RelationshipField {
    name?: string //somente view
    id?: string
    created?: Date
}

export function elementIsInsideArray(element: any, array: any[]): boolean {
    if (array.indexOf(element) >= 0) {
        return true;
    }
    return false;
}