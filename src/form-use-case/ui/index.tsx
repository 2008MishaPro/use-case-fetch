import { reatomComponent } from "@reatom/npm-react";
import {
    requestItemsAtom,
    addRequestItemAction,
    useCaseExecutionAtom,
    executeUseCaseAction,
    resetUseCaseAction,
    type RequestItem
} from "../model";
import { FormHeader } from "./parts/form-header";
import { UrlInput } from "./parts/url-input";
import { RequestItemComponent as RequestItemComponent } from "./parts/request-item";
import { ExecutionControls } from "./parts/execution-controls";
import { ExecutionResults } from "./parts/execution-results";
import styles from './styles.module.css';


export const FormUseCaseUI = reatomComponent(({ctx}) => {
    const requestItems = ctx.spy(requestItemsAtom)
    const execution = ctx.spy(useCaseExecutionAtom)

    const addNewRequest = () => {
        addRequestItemAction(ctx)
    }

    const handleExecuteUseCase = () => {
        console.log('Выполнение use-case начато')
        console.log('Текущие запросы:', requestItems)
        console.log('Текущее состояние выполнения:', execution)
        executeUseCaseAction(ctx)
    }

    const handleResetExecution = () => {
        resetUseCaseAction(ctx)
    }

    const updateRequestItem = (requestId: string, updates: Partial<RequestItem>) => {
        const currentItems = ctx.get(requestItemsAtom)
        const updatedItems = currentItems.map(item => 
            item.id === requestId ? { ...item, ...updates } : item
        )
        requestItemsAtom(ctx, updatedItems)
    }

    const removeRequestItem = (requestId: string) => {
         const currentItems = ctx.get(requestItemsAtom)
         const filteredItems = currentItems.filter(item => item.id !== requestId)
         requestItemsAtom(ctx, filteredItems)
     }


    return (
        <div className={styles.formContainer}>
            <FormHeader onAddRequest={addNewRequest} />
            <UrlInput />
            
            <div className={styles.spacingLarge}>
                {requestItems.map((item, index) => (
                    <RequestItemComponent
                        key={item.id}
                        item={item}
                        index={index}
                        onUpdate={(updates) => updateRequestItem(item.id, updates)}
                        onRemove={() => removeRequestItem(item.id)}
                    />
                ))}
            </div>

            <ExecutionControls
                onExecute={handleExecuteUseCase}
                onReset={handleResetExecution}
                isExecuting={execution.isExecuting}
                hasRequests={requestItems.length > 0}
            />

            <ExecutionResults results={execution.results} />
        </div>
    );
}, 'FormUseCaseUI');