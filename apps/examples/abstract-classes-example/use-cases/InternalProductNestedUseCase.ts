import { AbstractProductRepository } from '../abstracts/AbstractProductRepository';

export class InternalProductNestedUseCase{
    constructor(
        private productRepository: AbstractProductRepository
        
    ){

    }

}