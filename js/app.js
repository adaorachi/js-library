// Your web app's Firebase configuration
var firebaseConfig = {
  apiKey: "AIzaSyDE9O_Vdf00nik85EupWYgHorTDKgmqmes",
  authDomain: "my-library-project-8cc42.firebaseapp.com",
  databaseURL: "https://my-library-project-8cc42.firebaseio.com",
  projectId: "my-library-project-8cc42",
  storageBucket: "my-library-project-8cc42.appspot.com",
  messagingSenderId: "600577021676",
  appId: "1:600577021676:web:b3f907c0d0d51aad43b7c9",
  measurementId: "G-PGBPKN3WHY"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const dbRef = firebase.database().ref();


// Book Constructor
function Book(title, author, num, read) {
  this.title = title;
  this.author = author;
  this.num = num;
  this.read = read;
  this.favourites = window.localStorage.getItem('favourite_reads') == null ? [] : window.localStorage.getItem('favourite_reads').split(',');
  this.bookmarks = window.localStorage.getItem('bookmark_reads') == null ? [] : window.localStorage.getItem('bookmark_reads').split(',');
}

function getDate() {
  let today = new Date();
  let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
  let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  let dateTime = date + ' ' + time;
  return dateTime;
}

function stringLength(string, count) {
  return string.length > count ? `${string.slice(0, count)}...` : string;

}

// UI Constructor
function UI() { }

UI.prototype.displayViewContent = function (arrLinks, clickedLink) {
  let pushedArray = [];
  let allPageLinks = document.querySelectorAll(arrLinks);
  allPageLinks = Array.from(allPageLinks);

  for (let i = 0; i < allPageLinks.length; i++) {
    if (allPageLinks[i].className == 'list-item-link get-link') {
      let link = allPageLinks[i].getAttribute('data-target')
      pushedArray.push(link);
    }
  }
  let filteredArrays = pushedArray.filter(link => {
    return link != clickedLink
  })

  filteredArrays.forEach(function (linkitem) {
    let filteritem = linkitem = null ? 'top-books' : linkitem;
    document.getElementById(filteritem).style.display = 'none';
    document.getElementById(clickedLink).style.display = 'block';
  })

}

UI.prototype.displayInputMsg = function (ele, msg, className) {
  ele.innerHTML = msg;
  setTimeout(() => {
    document.getElementById(className).remove()
  }, 3000);
}

UI.prototype.displayReviews = function () {
  const addReview = document.getElementById('add-review-btn');
  addReview.addEventListener('click', function (e) {
    const review_comment = document.querySelector('#review-comment').value;
    const review_title = document.querySelector('#review-title').value;
    const review_id = document.querySelector('#review-id').value;
    const review_star = document.querySelectorAll('.star-icon.checked').length
    const review = {}
    review['review_comment'] = review_comment;
    review['review_title'] = review_title;
    review['review_id'] = review_id;
    review['review_star'] = review_star.toString();
    console.log(review)
    const reviewRef = dbRef.child('addreview');

    if (review_comment != '' && review_title != '') {
      reviewRef.push(review, function () {
        firebase.database().ref('addreview').once('value', (snap) => {
          let pushed_review = [];
          snap.forEach(function (childSnapshot) {
            let childKey = childSnapshot.key;
            let childData = childSnapshot.val();
            pushed_review.push(childData);
            document.querySelector('.review-content #review-comment').value = '';
            document.querySelector('.review-content #review-title').value = '';
            document.querySelectorAll('.star-icon.checked').forEach(item => {
              if (item.id != 'rate-1') {
                item.classList.remove('checked');
              }
            })
          });


          populateReview(pushed_review)

        });
      })
    }
    e.preventDefault()
  })

  firebase.database().ref('addreview').once('value', (snap) => {
    let pushed_review = [];
    snap.forEach(function (childSnapshot) {
      let childKey = childSnapshot.key;
      let childData = childSnapshot.val();
      pushed_review.push(childData);
    });
    populateReview(pushed_review)
  });
}

UI.prototype.addBookToList = function () {
  const addBookList = document.getElementById('addBookListBtn');
  addBookList.addEventListener('click', function (e) {
    const title = document.querySelector('#title'),
      author = document.querySelector('#author'),
      booknum = document.querySelector('#booknum'),
      read = document.querySelector('#read'),
      genre = document.querySelector('#genre'),
      shelf = document.querySelector('#shelf'),
      book_image = document.querySelector('#book-image').files[0];

    const book = new Book(title.value, author.value, booknum.value, read.checked);
    const ui = new UI();
    let requiredFields = [title, author, booknum, genre, shelf].filter(item => item.value == '');
    if (requiredFields.length >= 1 || book_image == undefined) {
      for (let i = 0; i < requiredFields.length; i++) {
        let data_attr = requiredFields[i].getAttribute('data-key')
        let msgError = document.getElementById(`msg-${data_attr}`)

        ui.displayInputMsg(msgError, '<small id="error-msg">Required Field</small>', 'error-msg')
      }

      if (book_image == undefined) {
        let dropzone = document.getElementById('drop_zone');
        let addCover = document.getElementById('add-book-cover');
        dropzone.style.border = '2px dashed #dc3545';
        addCover.innerHTML = '<span style="color: #dc3545">Book Cover required</span>';

        setTimeout(() => {
          dropzone.style.border = '2px dashed #ccc';
          addCover.innerHTML = '<span style="color: #555">Add Book Cover</span>';
        }, 3000)
      }

    } else {
      const otherField = document.querySelectorAll("#addBookListForm .other-field");
      for (let i = 0; i < otherField.length; i++) {
        let key = otherField[i].getAttribute('data-key');
        let value = otherField[i].value;
        book[key] = value;
      }


      let storageRef = firebase.storage().ref().child(book_image.name);
      let uploadTask = storageRef.put(book_image);

      uploadTask.on('state_changed', function (snapshot) {
      }, function (error) {
      }, function () {
        uploadTask.snapshot.ref.getDownloadURL().then(function (downloadURL) {
          book['book_image'] = downloadURL;
          book['created_at'] = getDate();
          book['id'] = document.querySelectorAll('.all-books .content .item').length;
          const bookListsRef = dbRef.child('addbook');

          bookListsRef.push(book, function () {
            location.reload();
            const localStorage = new LocalStorage;
            localStorage.changePage('discover');
          })
        });

      })
    }

    e.preventDefault()
  })
}

const editBookList = document.getElementById('editBookListBtn');
editBookList.addEventListener('click', function (e) {

  const bookID = document.querySelector("#edit-book-usid").value;
  const bookRef = dbRef.child('addbook/' + bookID);

  const editBookListForm = document.querySelectorAll("#editBookListForm .form-control");
  const editedBookValue = {};
  let book_image = document.querySelector('#edit-book-image').files[0];
  editBookListForm.forEach(function (textField) {
    let key = textField.getAttribute("data-key");
    let value = textField.value;
    if (key == 'read') {
      editedBookValue[key] = textField.checked;
    } else if (key == 'book_image') {
      editedBookValue[key] = document.querySelector('.edit-book-cover').getAttribute('src')
    }
    else {
      editedBookValue[key] = value
    }
  });
  if (book_image != undefined) {
    let storageRef = firebase.storage().ref().child(book_image.name);
    let uploadTask = storageRef.put(book_image);

    uploadTask.on('state_changed', function (snapshot) {
    }, function (error) {
    }, function () {
      uploadTask.snapshot.ref.getDownloadURL().then(function (downloadURL) {
        editedBookValue['book_image'] = downloadURL;
        bookRef.update(editedBookValue, function () {
          console.log("book has been updated with images");
          location.reload()
        });
      })
    })
  } else {
    bookRef.update(editedBookValue, function () {
      console.log("book has been updated");
      location.reload()
    });

  }

  console.log(editedBookValue)
  e.preventDefault()
})

UI.prototype.rateBook = function () {
  document.querySelectorAll('.star-icon').forEach(item => {
    let id = item.id;
    document.querySelector(`#${id}`).addEventListener('mouseover', function () {
      let rate_id = this.getAttribute('rate-id');
      for (let i = 1; i <= 5; i++) {
        if (i <= rate_id) {
          document.querySelector(`#rate-${i}`).classList.add('checked');
        } else {
          document.querySelector(`#rate-${i}`).classList.remove('checked');
        }
      }
    });

    // function increaseStar(className) {
    //   let rate_id = document.querySelector(`#${id}`).getAttribute('rate-id');
    //   for (let i = 1; i <= 5; i++) {
    //     if (i <= rate_id) {
    //       document.querySelector(`#rate-${i}`).classList.add(className);
    //     } else {
    //       document.querySelector(`#rate-${i}`).classList.remove(className);
    //     }
    //   }
    // }

  });

}
// dbRef.on('value', (snap) => {
//   let book_snapped = snap.val()
//   let addBookToContent = document.querySelector('.all-books .content');
//   for (let i = 0; i < book_snapped.length; i++) {
//     console.log(book_snapped[i])
//   }
//   console.log(book_snapped.addbook);
// });


if (window.localStorage.getItem('page_link') != 'add-a-book') {
  const book = new Book();

  firebase.database().ref('addbook').once('value', function (snapshot) {
    let addBookToContent = document.querySelector('.all-books .content');
    let addManagedBookToContent = document.querySelector('.all-books #managed-books');
    let pushArr = []
    snapshot.forEach(function (childSnapshot) {
      var childKey = childSnapshot.key;
      var childData = childSnapshot.val();
      childData['usid'] = childSnapshot.key;
      pushArr.push(childData)

    });

    pushArr = pushArr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());


    let book_titles = '<option value="" disabled selected>Current Read</option>'
    pushArr.forEach(item => {
      book_titles += `<option value="${item.id}">${item.title}</option>`;

    })
    document.querySelector('#current-read').innerHTML = book_titles;

    let selected_read;
    let current_read_select = document.getElementById('current-read');
    current_read_select.addEventListener('change', function () {
      let options = this.options[this.selectedIndex].value;
      selected_read = pushArr.filter(item => {
        return item.id == options;
      })

      document.querySelector('#currently-reading-title').innerText = `${selected_read[0].title}`;
      document.querySelector('#currently-reading-author').innerText = `${selected_read[0].author}`
      document.getElementById('current-read-image').innerHTML = `<img src="${selected_read[0].book_image}" alt="${selected_read[0].title}">`;


      document.getElementById('current-page').disabled = false;

    })

    if (current_read_select.value == '') {
      document.getElementById('current-page').disabled = true
    }



    let current_page_select = document.getElementById('current-page');
    current_page_select.addEventListener('keyup', function () {
      let computePer = parseInt((this.value / parseInt(selected_read[0].num)) * 100);
      if (this.value > parseInt(selected_read[0].num)) {
        document.querySelector('.exceed-page-msg').innerHTML = `<small class="text-danger">You have exceeded book total page</small>`;
      } else {
        document.getElementById('progress-bar-book').style.width = `${computePer}%`;
        document.getElementById('progress-percentage-info').innerText = `${computePer}%`;
        document.querySelector('.exceed-page-msg').innerHTML = '';
      }

    })





    pushArr.forEach(item => {
      let node = document.createElement('div');
      let favourite_icons, bookmark_icons;
      if (book.favourites.indexOf(item.id.toString()) >= 0) {
        favourite_icons = 'fas fa-heart liked-reads';
      } else {
        favourite_icons = 'far fa-heart unliked-reads';
      }
      if (book.bookmarks.indexOf(item.id.toString()) >= 0) {
        bookmark_icons = 'fas fa-bookmark booked-reads';
      } else {
        bookmark_icons = 'far fa-bookmark unbooked-reads';
      }
      node.classList = 'item text-center'
      node.innerHTML = `
                <div class="item-image">
                  <img class="img"
                    src="${item.book_image}"
                    alt="${item.title}">

                  <div class="like-icons">
                    <i class="${favourite_icons} favourite-icon" id="like-icon-${item.id}" data-like="${item.id}"></i>
                    <i class="${bookmark_icons} bookmark-icon" id="bookmark-icon-${item.id}" data-bookmark="${item.id}"></i>
                  </div>
                  
                  <div class="book-icons">
                    <span class="icons review-icon" id="review-icon-${item.id}" data-review="${item.id}">Reviews</span>

                    <span class="icons edit-icon" id="edit-icon-${item.id}" data-toggle="modal" data-target="#bookModal" data-id="${item.id}">Read</span>
                  </div>
                </div>
                <div class="info mt-1">
                  <h5>${item.title}</h5>
                  <p>By ${item.author}</p>
                </div>`

      addBookToContent.appendChild(node);
    })


    document.querySelectorAll(`.edit-icon`).forEach(item => {
      let id = item.id;
      document.querySelector(`#${id}`).addEventListener('click', function (e) {
        let data_id = this.getAttribute('data-id');

        let filtered_data = pushArr.filter(itemfil => itemfil.id == data_id);

        var ref = firebase.database().ref("addreview");
        ref.orderByChild('review_id').equalTo(data_id).on("value", function (snapshot) {
          let review_count;
          if (snapshot.val() == null) {
            review_count = '0 vote';
          } else {
            let count = Object.values(snapshot.val()).map(item => item.review_star).reduce((acc, ele) => parseInt(acc) + parseInt(ele));
            review_count = count == 1 ? '1 vote' : `${count} votes`;
          }

          let modal_content = document.querySelector('.modal .modal-body .content');
          modal_content.innerHTML = `
            <div class="row no-gutters m-0">
            <div class="col-6 p-0">
              <div class="image">
                <img
                  src="${filtered_data[0].book_image}"
                  alt="${filtered_data[0].title}">
              </div>
            </div>
            <div class="col-6">
              <div class="info text-center">
                <h6>${filtered_data[0].title}</h6>
                <div class="d-flex justify-content-around">
                  <p>
                    <span class="fas fa-star modal-star-checked"></span>
                    <span>${review_count}</span>
                  </p>
                  <p>${filtered_data[0].num} pages</p>
                </div>
                <div class="mb-4">
                  <a href="${filtered_data[0].booklink}" class="button">Read the book</a>
                </div>
      
                <p>${stringLength(filtered_data[0].description, 300)}</p>
              </div>
            </div>
            </div>`;

        });
        // modal_content.appendChild(modal_node);
      })
    });

    document.querySelectorAll(`.review-icon`).forEach(item => {
      let id = item.id;
      document.querySelector(`#${id}`).addEventListener('click', function () {
        let data_review = this.getAttribute('data-review');

        const localStorage = new LocalStorage;
        let stored_review_id = localStorage.setReviewId(data_review);

        let filtered_reviewed_book = pushArr.filter(itemfil => itemfil.id == stored_review_id);
        document.querySelector('.book-reviewed-title').textContent = `${filtered_reviewed_book[0].title}`;
        document.querySelector('.review-content .hidden-id').innerHTML = `<input type="hidden" value="${stored_review_id}" id="review-id">`;

        console.log(filtered_reviewed_book)
        // document.querySelector('#review-container').append('append_review')

        firebase.database().ref('addreview').once('value', (snap) => {
          let pushed_review = [];
          snap.forEach(function (childSnapshot) {
            let childKey = childSnapshot.key;
            let childData = childSnapshot.val();
            pushed_review.push(childData);
            document.querySelector('.review-content #review-comment').value = '';
            document.querySelector('.review-content #review-title').value = '';
            document.querySelectorAll('.star-icon.checked').forEach(item => {
              if (item.id != 'rate-1') {
                item.classList.remove('checked');
              }
            })
          });


          populateReview(pushed_review)

        });
      })
    });


    document.querySelectorAll(`.favourite-icon`).forEach(item => {
      let id = item.id;

      document.querySelector(`#${id}`).addEventListener('click', function (e) {
        let data_like = this.getAttribute('data-like');

        if (this.classList.contains('unliked-reads')) {
          this.classList.add('liked-reads', 'fas');
          this.classList.remove('unliked-reads', 'far');
          book.favourites.push(data_like);
        } else if (this.classList.contains('liked-reads')) {
          this.classList.add('unliked-reads', 'far');
          this.classList.remove('liked-reads', 'fas');
          book.favourites.splice(book.favourites.indexOf(data_like), 1);
        }

        window.localStorage.setItem('favourite_reads', book.favourites.join(','))

        addBookmarkToDom('#favourite-books', book.favourites)

      })

    });


    function addBookmarkToDom(page_to_add, stored_book) {
      let add_books = '';
      pushArr.filter(item => {
        return stored_book.includes(item.id.toString())
      }).forEach(item => {
        add_books += `<div class="item">
            <img class="img-fluid"
              src="${item.book_image}"
              alt="book-cover" />
            <div class="info">
              <div class="row no-gutters">
                <div class="col-5"></div>
                <div class="col-7 px-3 mt-3">
                  <h5 class="title">${item.title}</h5>
                  <span>By ${item.author}</span>
                  <p class="mt-2">${stringLength(item.description, 65)}</p>
                  <a href="${item.booklink}" class="button">See the book</a>
                </div>
              </div>

            </div>
          </div>`
      })
      document.querySelector(page_to_add).innerHTML = add_books;
    }

    addBookmarkToDom('#favourite-books', book.favourites);



    document.querySelectorAll(`.bookmark-icon`).forEach(item => {
      let id = item.id;

      document.querySelector(`#${id}`).addEventListener('click', function (e) {
        let data_bookmark = this.getAttribute('data-bookmark');

        if (this.classList.contains('unbooked-reads')) {
          this.classList.add('booked-reads', 'fas');
          this.classList.remove('unbooked-reads', 'far');
          book.bookmarks.push(data_bookmark);
        } else if (this.classList.contains('booked-reads')) {
          this.classList.add('unbooked-reads', 'far');
          this.classList.remove('booked-reads', 'fas');
          book.bookmarks.splice(book.bookmarks.indexOf(data_bookmark), 1);
        }

        window.localStorage.setItem('bookmark_reads', book.bookmarks.join(','))

        addBookmarkToDom('#bookmarked-books', book.bookmarks);

      })

    });

    addBookmarkToDom('#bookmarked-books', book.bookmarks);


    pushArr.forEach(item => {
      let node = document.createElement('div');
      let read_status, check_icon;
      if (item.read) {
        read_status = 'cover cover-hover';
        check_icon = '<i class="fas fa-check"></i>'
      } else {
        read_status = 'cover cover-unhover';
        check_icon = '';
      }
      node.classList = 'managed-content text-center'
      node.innerHTML = `
          <div class="position-relative">
            <img class="img-fluid cover-img"
              src="${item.book_image}"
              alt="book-cover" />
              <div class="hovered-content">
              <div class="${read_status} read-icon" id="read-book-${item.id}" data-read="${item.usid}"> ${item.read ? 'Read' : 'Unread'} ${check_icon}</div>
            </div>
          </div>
          <div class="managed-icons">
            <i class="fas fa-edit color-primary edit-icon" data-toggle="modal" data-target="#editBookModalLong" data-id="${item.usid}"></i>
            <i class="fas fa-times-circle text-danger delete-icon" data-delete="${item.usid}" id="delete-book-${item.id}"></i>
          </div>
          <h5>${item.title}</h5>`

      addManagedBookToContent.appendChild(node);
    })

    document.querySelectorAll(`.delete-icon`).forEach(item => {
      let id = item.id;
      document.getElementById(`${id}`).addEventListener('click', function (e) {
        var result = confirm("Are you sure you want to delete this book?");
        if (result) {
          this.parentElement.parentElement.remove();
          let userID = this.getAttribute("data-delete");
          let userRef = dbRef.child('addbook/' + userID);
          userRef.remove()
        }

      })
    });


    document.addEventListener('click', function (e) {
      if (e.target.classList.contains('read-icon')) {
        let id = e.target.id;
        let read_content = document.getElementById(id).innerText;
        let check_icon = '<i class="fas fa-check"></i>'
        let changed_text = read_content == 'Read' ? ['Unread', false, 'cover-unhover'] : [`Read ${check_icon}`, true, 'cover-hover'];

        document.getElementById(id).className = `read-icon cover ${changed_text[2]}`;
        document.getElementById(id).innerHTML = changed_text[0];
        let userID = document.getElementById(id).getAttribute("data-read");
        let userRef = dbRef.child('addbook/' + userID);
        userRef.update({
          "read": changed_text[1]
        });
      }
    })

    document.addEventListener('click', function (e) {
      if (e.target.classList.contains('edit-icon')) {
        let usid = e.target.getAttribute('data-id');
        const bookRef = dbRef.child('addbook/' + usid);
        document.querySelector("#hidden-field").innerHTML = `<input type="hidden" value="${usid}" id="edit-book-usid">`;
        const editBookListForm = document.querySelectorAll("#editBookListForm .form-control");

        bookRef.on("value", snap => {
          for (var i = 0, len = editBookListForm.length; i < len; i++) {
            if (editBookListForm[i].getAttribute("data-key") == 'read') {
              var read = editBookListForm[i].getAttribute("data-key");
              editBookListForm[i].checked = snap.val()[read];

            } else if (editBookListForm[i].getAttribute("data-key") == 'book_image') {
              var book_image = editBookListForm[i].getAttribute("data-key");
              console.log(book_image)
              document.querySelector('#edit-display-img').innerHTML = `<img src="${snap.val()[book_image]}" class="edit-book-cover">`
            }
            else {
              var key = editBookListForm[i].getAttribute("data-key");
              editBookListForm[i].value = snap.val()[key];
            }

          }
        });

      }
    })




    let stored_review_id = window.localStorage.getItem('review_id')
    let filtered_reviewed_book = pushArr.filter(itemfil => itemfil.id == stored_review_id);
    document.querySelector('.book-reviewed-title').textContent = `${filtered_reviewed_book[0].title}`;
    document.querySelector('.review-content .hidden-id').innerHTML = `<input type="hidden" value="${stored_review_id}" id="review-id">`;

  });
}


function populateReview(pushed_review) {
  let reviewed_book = pushed_review.filter(item => item.review_id == window.localStorage.getItem('review_id').toString());

  reviewed_book == undefined ? [] : reviewed_book[0];

  if (reviewed_book.length > 0) {
    let concat_content = '';
    reviewed_book.forEach(item => {
      let rate_star = '';
      for (let i = 1; i <= 5; i++) {
        if (i <= item.review_star) {
          rate_star += '<span class="fa fa-star star check"></span>';
        } else {
          rate_star += '<span class="fa fa-star star uncheck"></span>';
        }
      }

      concat_content += `
      <div class="reviewed-comment list-group-item text-dark">
        <div class="stars">
        ${rate_star}
        </div>
        <div>
          <h6>${item.review_title}</h6>
          <p>${item.review_comment}</p>
        </div>
        </div>`
    })

    document.querySelector('#review-container').innerHTML = concat_content;

  } else {
    document.querySelector('#review-container').innerHTML = '<h6 class="text-center mt-3">No reviews</h6>';
  }
}
// bookListsRef.on("child_added", snap => {
//   let book_snapped = snap.val();
//   console.log(book_snapped)
// })


// LocalStorage Constructor
function LocalStorage() { }

LocalStorage.prototype.getPage = function () {
  let page;
  if (window.localStorage.getItem('page_link') === null) {
    window.localStorage.setItem('page_link', 'top-books');
  }
  page = window.localStorage.getItem('page_link');

  const ui = new UI()
  ui.displayViewContent('#app-links .get-link', page)
  if (page == 'discover' || page == 'now-reading') {
    document.getElementById('last-column').style.display = 'block';
    document.getElementById('navbar-light').style.maxWidth = '58.3%';
    document.getElementById('navbar-light').style.flex = '0 0 58.3%';

  } else {
    document.getElementById('last-column').style.display = 'none';
    document.getElementById('navbar-light').style.maxWidth = '83.3%';
    document.getElementById('navbar-light').style.flex = '0 0 83.3%';
  }
}

LocalStorage.prototype.setReviewId = function (reviewId) {
  if (window.localStorage.getItem('review_id') === null) {
    window.localStorage.setItem('review_id', 'no-reviews');
  } else {
    window.localStorage.setItem('review_id', reviewId);
  }
  let review_id = window.localStorage.getItem('review_id')
  return review_id;
}

LocalStorage.prototype.setPage = function (clickedArea) {
  let clicked_area = document.getElementById(clickedArea)
  clicked_area.addEventListener('click', function (e) {
    if (e.target.className == 'list-item-link get-link') {
      let page_target = e.target.getAttribute('data-target');
      console.log(page_target);
      window.localStorage.setItem('page_link', `${page_target}`)
      const ui = new UI()
      ui.displayViewContent('#app-links .get-link', page_target)

      if (page_target == 'discover' || page_target == 'now-reading') {
        document.getElementById('last-column').style.display = 'block';
        document.getElementById('navbar-light').style.maxWidth = '58.3%';
        document.getElementById('navbar-light').style.flex = '0 0 58.3%';

      } else {
        document.getElementById('last-column').style.display = 'none';
        document.getElementById('navbar-light').style.maxWidth = '83.3%';
        document.getElementById('navbar-light').style.flex = '0 0 83.3%';

      }
    }
  })
}

LocalStorage.prototype.changePage = function (page) {
  window.localStorage.setItem('page_link', page)
  const ui = new UI()
  ui.displayViewContent('#app-links .get-link', page)
}

const localStorage = new LocalStorage()
localStorage.getPage()
localStorage.setPage('app-links')

const ui = new UI()
ui.addBookToList()
ui.displayReviews()
ui.rateBook()



$('#book-image').on('change', function (event) {

  var files = event.target.files;
  var image = files[0]
  console.log(image.size);
  var reader = new FileReader();
  reader.onload = function (file) {
    var img = new Image();
    img.src = file.target.result;

    $('#display-img').html(img);

    $('#drop_zone').css({
      'opacity': '0',
      'border': 'none'
    });
  }
  reader.readAsDataURL(image);
  console.log(files);
});

$('#edit-book-image').on('change', function (event) {
  var files = event.target.files;
  var image = files[0]
  console.log(image.size);
  var reader = new FileReader();
  reader.onload = function (file) {
    var img = new Image();
    $(img).addClass('edit-book-cover')
    img.src = file.target.result;

    $('#edit-display-img').html(img);

    $('#drop_zone').css({
      'opacity': '0',
      'border': 'none'
    });
  }
  reader.readAsDataURL(image);
  console.log(files);
});




// var starCountRef = firebase.database().ref('posts/' + postId + '/starCount');
