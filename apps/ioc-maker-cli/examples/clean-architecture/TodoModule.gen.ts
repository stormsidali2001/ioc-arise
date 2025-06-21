import { TodoRepository } from './repositories/TodoRepository';
import { UpdateTodoUseCase } from './use-cases/UpdateTodoUseCase';
import { GetTodoUseCase } from './use-cases/GetTodoUseCase';
import { DeleteTodoUseCase } from './use-cases/DeleteTodoUseCase';
import { CreateTodoUseCase } from './use-cases/CreateTodoUseCase';
import { UpdateTodoPresenter } from './presenters/UpdateTodoPresenter';
import { GetTodoPresenter } from './presenters/GetTodoPresenter';
import { DeleteTodoPresenter } from './presenters/DeleteTodoPresenter';
import { CreateTodoPresenter } from './presenters/CreateTodoPresenter';
import { createUserModuleContainer } from './UserModule.gen';
function createTodoModuleContainer(userModuleContainer: ReturnType<typeof createUserModuleContainer>) {
  const updateTodoPresenterFactory = (): UpdateTodoPresenter => new UpdateTodoPresenter();
  const getTodoPresenterFactory = (): GetTodoPresenter => new GetTodoPresenter();
  const deleteTodoPresenterFactory = (): DeleteTodoPresenter => new DeleteTodoPresenter();
  const createTodoPresenterFactory = (): CreateTodoPresenter => new CreateTodoPresenter();

  let createTodoUseCase: CreateTodoUseCase | undefined;
  let deleteTodoUseCase: DeleteTodoUseCase | undefined;
  let getTodoUseCase: GetTodoUseCase | undefined;
  let updateTodoUseCase: UpdateTodoUseCase | undefined;
  let todoRepository: TodoRepository | undefined;

  const getCreateTodoUseCase = (): CreateTodoUseCase => {
    if (!createTodoUseCase) {
      createTodoUseCase = new CreateTodoUseCase(userModuleContainer.IUserRepository, createTodoPresenterFactory());
    }
    return createTodoUseCase;
  };
  const getDeleteTodoUseCase = (): DeleteTodoUseCase => {
    if (!deleteTodoUseCase) {
      deleteTodoUseCase = new DeleteTodoUseCase(userModuleContainer.IUserRepository, getTodoRepository(), deleteTodoPresenterFactory());
    }
    return deleteTodoUseCase;
  };
  const getGetTodoUseCase = (): GetTodoUseCase => {
    if (!getTodoUseCase) {
      getTodoUseCase = new GetTodoUseCase(userModuleContainer.IUserRepository, getTodoRepository(), getTodoPresenterFactory());
    }
    return getTodoUseCase;
  };
  const getUpdateTodoUseCase = (): UpdateTodoUseCase => {
    if (!updateTodoUseCase) {
      updateTodoUseCase = new UpdateTodoUseCase(userModuleContainer.IUserRepository, getTodoRepository(), updateTodoPresenterFactory());
    }
    return updateTodoUseCase;
  };
  const getTodoRepository = (): TodoRepository => {
    if (!todoRepository) {
      todoRepository = new TodoRepository();
    }
    return todoRepository;
  };

  return {
        get TodoRepository(): TodoRepository {
          return getTodoRepository();
        },
        get ITodoRepository(): TodoRepository {
          return getTodoRepository();
        },
        get UpdateTodoUseCase(): UpdateTodoUseCase {
          return getUpdateTodoUseCase();
        },
        get IUpdateTodoInputPort(): UpdateTodoUseCase {
          return getUpdateTodoUseCase();
        },
        get GetTodoUseCase(): GetTodoUseCase {
          return getGetTodoUseCase();
        },
        get IGetTodoInputPort(): GetTodoUseCase {
          return getGetTodoUseCase();
        },
        get DeleteTodoUseCase(): DeleteTodoUseCase {
          return getDeleteTodoUseCase();
        },
        get IDeleteTodoInputPort(): DeleteTodoUseCase {
          return getDeleteTodoUseCase();
        },
        get CreateTodoUseCase(): CreateTodoUseCase {
          return getCreateTodoUseCase();
        },
        get ICreateTodoInputPort(): CreateTodoUseCase {
          return getCreateTodoUseCase();
        },
        get UpdateTodoPresenter(): UpdateTodoPresenter {
          return updateTodoPresenterFactory();
        },
        get IUpdateTodoOutputPort(): UpdateTodoPresenter {
          return updateTodoPresenterFactory();
        },
        get GetTodoPresenter(): GetTodoPresenter {
          return getTodoPresenterFactory();
        },
        get IGetTodoOutputPort(): GetTodoPresenter {
          return getTodoPresenterFactory();
        },
        get DeleteTodoPresenter(): DeleteTodoPresenter {
          return deleteTodoPresenterFactory();
        },
        get IDeleteTodoOutputPort(): DeleteTodoPresenter {
          return deleteTodoPresenterFactory();
        },
        get CreateTodoPresenter(): CreateTodoPresenter {
          return createTodoPresenterFactory();
        },
        get ICreateTodoOutputPort(): CreateTodoPresenter {
          return createTodoPresenterFactory();
        }
  };
}
export { createTodoModuleContainer };
export type TodoModuleContainer = ReturnType<typeof createTodoModuleContainer>;