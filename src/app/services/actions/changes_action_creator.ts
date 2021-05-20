import { IAction } from "../../../types/action";
import { IQuery } from "../../../types/query-runner";
import { DEVX_API_URL } from "../graph-constants";
import { CHANGES_FETCH_SUCCESS } from "../redux-constants";

export function changesResponse(response: object): IAction {
    return {
        type: CHANGES_FETCH_SUCCESS,
        response,
    };
}

export function changesEndpoint(query: IQuery) {
    const graphVersion = query.selectedVersion;
    const daysRange = 90;
    // const escapedUrl = encodeURIComponent(query.sampleUrl);  TODO: add URL parameter
    const changesUrl = `${DEVX_API_URL}/changes?graphVersion=${graphVersion}&daysRange=${daysRange}`;

    return fetch(changesUrl);
}

export async function getChanges(query: IQuery, dispatch: Function) {
    const result = await changesEndpoint(query)
        .then(response => {
            if (response.ok) {
                return response.json()
            }
        })
        .catch(error => {
            throw error;
        });
    return dispatch(changesResponse({
        body: result
    }));
}