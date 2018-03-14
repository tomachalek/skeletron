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

import * as Rx from '@reactivex/rxjs';


export interface Action {
    type:string;
    payload?:Error|{[key:string]:any};
    error?:boolean;
    isSideEffect?:boolean;
}


export interface SideEffectAction extends Action {
    isSideEffect:true;
}


export const isUIAction = (action:AnyAction):action is Action => {
    return !action.isSideEffect;
};


export const isSideEffectAction = (action:AnyAction):action is SideEffectAction => {
    return action.isSideEffect;
};


export type AnyAction = Action | SideEffectAction;


export interface EventEmitterSubscription {

}


export interface IEventListener<T> {
    (state?:T):void;
}


export interface IEventEmitter<T={}> {
    addListener(callback:(state?:T)=>void):Rx.Subscription;
    emitChange():void;
}


export interface IReducer<T> {
    reduce(state:T, action:Action):T;
}


export interface SideEffectHandler<T> {
    (state:T, action:Action, dispatch:(seAction:Action)=>void):void;
}


export type IActionHandler = Rx.Observer<Action>;


export class ActionDispatcher {

    private inAction$:Rx.Subject<AnyAction>;

    private action$:Rx.Observable<AnyAction>;

    constructor() {
        this.inAction$ = new Rx.Subject<Action>();
        this.action$ = this.inAction$.flatMap(v => {
            if (v instanceof Rx.Observable) {
                return v;

            } else {
                return Rx.Observable.from([v]);
            }
        }).share();
        this.dispatch = this.dispatch.bind(this);
    }

    dispatch(action:AnyAction):void {
        this.inAction$.next(action);
    }

    registerActionHandler(model:IActionHandler):Rx.Subscription {
        return this.action$.subscribe(model);
    }

    registerReducer<T>(model:IReducer<T>, initialState:T, sideEffects?:SideEffectHandler<T>):Rx.BehaviorSubject<T> {
        const state$ = new Rx.BehaviorSubject(null);
        this.action$
            .startWith(null)
            .scan(
                (state:T, action:Action) => {
                    const newState = action !== null ? model.reduce(state, action) : state;
                    sideEffects && action !== null ?
                        sideEffects(
                            newState,
                            action,
                            (seAction:Action) => {
                                if (action.isSideEffect) {
                                    throw new Error('Nested side-effect not allowed');
                                }
                                this.dispatch({
                                    isSideEffect:true,
                                    type: seAction.type,
                                    payload: seAction.payload,
                                    error: seAction.error
                                });
                            }
                        ) :
                        null;
                    return newState;
                },
                initialState
            )
            .subscribe(state$);
        return state$;
    }
}