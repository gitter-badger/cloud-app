function closeColorbox() {
    window.parent.$.colorbox.close();
}

function cancelDelete() {
    closeColorbox();
}

function confirmDelete(id) {
    window.parent.$.ajax({
        url:'/account/delete',
        type:'POST',
        data: { id: id }
    }).done(function (res){
        closeColorbox();
        window.parent.location.href = '/logout';
    });
}