var notes = []

$(document).ready(function () {
    console.log("Frontend")
    notes = getNotes()
    $("#welcome").html(getCookie("username"))
    showNotes()
});

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function getNotes() {
    var tmp = "";
    console.log(getCookie("id"))
    $.ajax({
        'async': false,
        url: '/getNote',
        type: 'POST',
        dataType: 'json',
        data: {
            id: getCookie("id")
        },
        success: function (result) {
            tmp = result;
        }
    })
    return tmp;
};

let logout = document.getElementById("logout");
logout.addEventListener("click", function (e) {
    $.ajax({
        url: '/logout',
        type: 'DELETE',
        dataType: 'json',
        success: function (data) {
            window.location.href = '/';
        }
    });
})


// If user adds a note, add it to the localStorage
let addBtn = document.getElementById("addBtn");
addBtn.addEventListener("click", function (e) {
    let addTxt = document.getElementById("addTxt");
    if (notes == null) notesObj = [];
    else {
        $.ajax({
            url: '/addNote',
            type: 'POST',
            dataType: 'json',
            data: {
                desc: addTxt.value,
                id: getCookie("id")
            },
        });
        window.location = window.location.pathname;
    }

    addTxt.value = "";
    showNotes();
});

// Function to show elements from localStorage
function showNotes() {
    if (notes == null) {
        console.log("Empty list")
        notesObj = [];
    } else
        notesObj = notes;
    let html = "";
    for (let i = 0; i < notes.length; i++) {
        html += `<div class="noteCard my-2 mx-2 card" 
    style="width: 18rem;">
        <div class="card-body">
            <h5 class="card-title">
                Note ${i + 1}
            </h5>
            <p class="card-text"> 
                ${notes[i].description}
            </p>

          <button id="${notes[i].id_note}" onclick=
            "deleteNote(this.id)"
            class="btn btn-primary">
            Delete Note
        </button>
    </div>
</div>`;

    }
    if (notesObj.length != 0)
        $('#notes').html(html);
    else
        $('#notes').html(`Nothing to show! 
    Use "Add a Note" section above to add notes.`);
}

function deleteNote(id_note) {
    $.ajax({
        url: '/deleteNote',
        type: 'DELETE',
        data: {
            id_note: id_note,
            id_user: getCookie("id")
        },
        success: function (data) {
            console.log("Eliminato")
        }
    });
    notes = getNotes();
    showNotes();
}