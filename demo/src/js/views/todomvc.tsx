/*
 * Copyright 2018 Tomas Machalek <tomas.machalek@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from 'react';

import {TodoState, TodoModel} from '../models/todo';
import {BoundWithProps, Bound, ViewUtils, ActionDispatcher} from 'kombo';
import { ActionNames, Actions } from '../models/actions';
import { AdjectivesModel, AdjectivesModelState } from '../models/adjectives';


export function init(dispatcher:ActionDispatcher, ut:ViewUtils<{}>, todoModel:TodoModel, adjModel:AdjectivesModel) {


    // ------------------- <TodoText /> --------------------------------

    const TodoText:React.SFC<{
        text:string;
        id:number;
        complete:boolean;

    }> = (props) => {

        const handleInputChange = (evt:React.ChangeEvent<{value:string}>) => {
            dispatcher.dispatch<Actions.SetTextTodo>({
                name: ActionNames.SetTextTodo,
                payload: {
                    id: props.id,
                    value: evt.target.value
                }
            });
        }

        return <input type="text" value={props.text} onChange={handleInputChange}
                    placeholder={ut.translate('input_add_task_placeholder')} disabled={props.complete} />;
    };

    // ------------------- <TodoCheckbox /> --------------------------------

    const TodoCheckbox:React.SFC<{
        id:number;
        checked:boolean;

    }> = (props) => {

        const handleCheckbox = (evt:React.ChangeEvent<{}>) => {
            dispatcher.dispatch<Actions.ToggleTodo>({
                name: ActionNames.ToggleTodo,
                payload: {
                    id: props.id
                }
            });
        };

        return <input type="checkbox" checked={props.checked} onChange={handleCheckbox} />;
    };

    // ------------------- <ActIcon /> --------------------------------

    const ActIcon:React.SFC<{
        id:number;
        complete:boolean;
    }> = (props) => {

        const [isActive, setActive] = React.useState(false);

        const handleClick = () => {
            if (isActive) {
                dispatcher.dispatch<Actions.DeleteTodo>({
                    name: ActionNames.DeleteTodo,
                    payload: {id: props.id}
                });
            }
        };

        const handleMouseover = () => {
            setActive(true);
        };

        const handleMouseout = () => {
            setActive(false);
        }

        const getIcon = () => props.complete ? '\u263A' : '\u00a0';

        return <a className={`act-icon${props.complete ? ' done' : ''}`}
                    onClick={handleClick} onMouseOver={handleMouseover}
                    onMouseOut={handleMouseout}>{isActive ? '\u274C' : getIcon()}</a>;
    };

    // ------------------- <TodoRow /> --------------------------------

    const TodoRow:React.SFC<{
        idx:number;
        id:number;
        text:string;
        complete:boolean;

    }> = (props) => {
        return <>
            <dt>
                <em>{props.idx + 1}. {ut.formatDate(new Date(props.id), 1)}</em>
            </dt>
            <dd>
                <TodoCheckbox id={props.id} checked={props.complete} />
                <TodoText {...props} />
                <ActIcon id={props.id} complete={props.complete} />
            </dd>
        </>;
    }

    // ------------------- <AddTodoButton /> --------------------------------

    const AddTodoButton = (props) => {

        const handleClick = () => {
            dispatcher.dispatch<Actions.AddTodo>({
                name: ActionNames.AddTodo
            });
        }

        return <button type="button" onClick={handleClick}>{ut.translate('btn_add_todo')}</button>;
    }

    // ------------------- <GenerateTasks /> --------------------------------

    const GenerateTasks:React.SFC<{
        isBusy:boolean;

    }> = (props) => {

        const handleClick = () => {
            dispatcher.dispatch<Actions.FetchTodos>({
                name: ActionNames.FetchTodos
            });
        };

        if (props.isBusy) {
            return <img src="./img/ajax-loader.gif" />;

        } else {
            return <button type="button" onClick={handleClick}>{ut.translate('btn_generate')}</button>;
        }
    }

    // ------------------- <AddAdjectivesCheckbox /> --------------------

    const AddAdjectivesCheckbox:React.SFC<{
        active:boolean;
    }> = (props) => {

        const handleChange = () => {
            dispatcher.dispatch<Actions.ToggleAddAdjectives>({
                name: ActionNames.ToggleAddAdjectives
            })
        };

        return (
            <label className="AddAdjectivesCheckbox">Attach adjectives from a server
                <input type="checkbox" checked={props.active} onChange={handleChange} />
            </label>
        )
    }

    // ------------------- <TodoTable /> --------------------------------

    const TodoTable:React.SFC<{version:string} & TodoState> = (props) => {

        return (
            <div className="TodoTable">
                {props.error ?
                    <div className="error">{props.error}</div> :
                    null
                }
                <dl>
                    {props.items.map((item, i) => <TodoRow key={`id:${item.id}`} idx={i} {...item} />)}
                </dl>
                <section className="controls">
                    <div><AddAdjectivesCheckbox active={props.generateAdjectives} /></div>
                    <div>
                        <span><AddTodoButton /></span>
                        <span><GenerateTasks isBusy={props.isBusy} /></span>
                    </div>
                </section>
            </div>
        );
    };

    const BoundTodoTable = BoundWithProps<{version:string}, TodoState>(TodoTable, todoModel);


    // --------------- <AdjLoader /> -----------------------

    const AdjLoader:React.SFC<AdjectivesModelState> = (props) => {

        const handleClick = () => {
            dispatcher.dispatch<Actions.ToggleAdjectivesHelp>({
                name: ActionNames.ToggleAdjectivesHelp,
            });
        };

        return (
            <div className="AdjLoader">
                {props.isActive ?
                    <>
                        <div>
                            <strong>Adjective server</strong><sup><a className="help" onClick={handleClick}>[?]</a></sup>:{'\u00a0'}
                            {props.isBusy ? <img src="./img/ajax-loader.gif" /> : <span>idle</span>}
                            {props.isHelpVisible ?
                                <p className="help">
                                    Adjective server is a fake async. service demonstrating dependence between
                                    two asynchronous model actions. When generating a ticket, both <code>TodoModel</code>
                                    and <code>AdjectivesModel</code> react to the same action. To make them react
                                    in the right order and also pass some needed data between them, the <code>TodoModel</code>
                                    will suspend and waits for an actions triggered by <code>AdjectiveModel</code>.
                                </p> :
                                null
                            }
                        </div>

                    </> : null
                }
            </div>
        );
    };

    const BoundAdjLoader = Bound<AdjectivesModelState>(AdjLoader, adjModel);

    // ---------------------- <TodoWidget /> -----------------------------

    const TodoWidget:React.SFC<{version:string}> = (props) => (
        <div>
            <BoundTodoTable version={props.version} />
            <BoundAdjLoader />
            <div></div>
        </div>
    );


    return {
        TodoWidget: TodoWidget
    };

}