import './App.css'
import {Flex} from "antd";
import {reatomComponent} from "@reatom/npm-react";
import {FormUseCaseUI} from "./form-use-case/ui";

const App = reatomComponent((ctx) => {
    return (
        <Flex
        >
            <FormUseCaseUI />
        </Flex>
    )
}, 'App')

export default App;