export const initialState = {
    // user: null,
    // userProfile: {
    //     id: "", 
    //     firstName: "",
    //     lastName: "",
    //     email: "",
    //     branch: ""
    // }
};

const reducer = (state, action) => {
    console.log(action);
    switch(action.type) {
        // case "CREATE_REQUEST":
        //     return {
        //         ...state, request: [...state.request]
        //     };

            case "SET_USER":
                return {
                    ...state,
                    user: action.user,
                };

            // case "CLEAR_REQUEST":
            //     return {
            //         ...state,
            //     }

        default:
            return state;
    };
};

export default reducer;