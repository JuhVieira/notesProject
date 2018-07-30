import { Collection } from "../modules/firestore/collection";

export class Note extends Collection {

    static path = 'notes'

    id?: string
    user_id?: string
    title?: string
    description?: string
    created_at?: Date
    expiring_date?: string

}

/**
 * Aqui é uma entidade onde tudo que você faz é utilizando o 'Note' nome da classe
 * o path é o nome de como vai ficar no banco de dados, mas isso não importa
 * 
 * funções basicas da entidade
 * 
 * 1- Criar - entidade.add(objeto)
 * 2- Listar - entidade.list() Retorna um Array de itens da sua entidade
 * 2- Editar - entidade.update(id_objeto, novo_objeto)
 * 3- Deletar - entidade.remove(id_objeto) 
 * 
 * Todas essas funções são Observables então não esqueça de da o Subscribe quando for usalas
 * o subscribe fica escutando sempre que tiver alguma alteração na requisição 
 * ele é chamado com os novos dados
 * 
 * EX: entidade.list().subscribe((itens) => {
 *  console.log(itens)
 * })
 */
