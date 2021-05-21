import React from 'react';
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IRootState } from "../../../../types/root";
import { getChanges } from "../../../services/actions/changes_action_creator";

const ChangeLog = () => {

    const sampleQuery = useSelector((state: IRootState) => state.sampleQuery);
    const dispatch = useDispatch();
    console.log(sampleQuery);

    useEffect(() => {
        dispatch(getChanges(sampleQuery, dispatch));
    }, []);

    return (
        <div>
            <p> Text</p>
        </div>
    )
}
export default ChangeLog;