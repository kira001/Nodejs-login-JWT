var dashboard =  {
    id: 0,
    user: "",
    token: ""
  };
var listNotes = []

function setDashBoard(id, user, token){
    dashboard.id = id 
    dashboard.token = token
    dashboard.user = user
}

function getDashboard(){
    return dashboard
}

function reset() {
    dashboard.id = 0
    dashboard.token = ""
    dashboard.user = ""
}


module.exports = {
    setDashBoard, getDashboard, reset
};

