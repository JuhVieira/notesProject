export interface Address {
    //Avenida ou Rua
    street?: string,
    //Número do estabelecimento ou residência
    number?: string,
    //Complemento
    complement?: string,
    //CEP
    cep?: string,
    // Latitude
    latitude?: number,
    //Longitude
    longitude?: number,
    //Bairro
    district?: string,
    //Cidade
    city?: string,
    //Estado
    state?: string, //Ex: Ceará
    state_short?: string, //Ex: CE
    //País
    country?: string, //Ex: Brasil
    country_short?: string, //Ex: BR
    //Ponto de referência
    landmark?: string
    // Verificar se a localização é por meio de gps
    isGps?: boolean
}