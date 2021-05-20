import { IAction } from "../../../types/action";
import { CHANGES_FETCH_SUCCESS } from "../redux-constants";

export function changes(state = {}, action: IAction): any {
    switch (action.type) {
        case CHANGES_FETCH_SUCCESS:
            return action.response;
        default:
            return state;
    }
}