import { container } from './container.gen';

// Test autocomplete - type a string and see if you get suggestions
const service = container.resolve('ICreateTodoInputPort');

// The type should be inferred as ICreateTodoInputPort
service.execute({
    title: 'Test',
    description: 'Test description',
    userId: '1'
});

// Try typing: container.resolve('
// You should see all registered tokens as autocomplete suggestions

