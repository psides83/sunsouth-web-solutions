export const initialState = {
   loading: true
};

const reducer = (state, action) => {
    console.log(action);
    switch(action.type) {

        case "SET_USER":
            return {
                ...state,
                user: action.user,
            };

        case "SET_ACTIVE_REQUEST":
            return {
                ...state,
                activeRequest: action.activeRequest,
            };

        case "SET_USER_PROFILE":
            return {
                ...state,
                userProfile: action.userProfile,
            };

        default:
            return state;
    };
};

export default reducer;