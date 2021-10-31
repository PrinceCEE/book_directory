const fileUtil = require("../fileUtil");

const routeHandler = {};

routeHandler.userRegister = (data, callback) => {
  //validate that all required fields are filled out
  const { payload } = data;

  for (let x in payload) {
    if (typeof payload[x] !== "string" && payload[x].trim().length === 0) {
      callback(400, { message: `Field {${x}} is incorrect` });
      break;
    }
  }

  // add list of borrowed books to user
  payload.borrowedBooks = [];
  fileUtil.create("users", payload, (err) => {
    if (!err) {
      callback(200, { message: "User created successfully", data: null });
    } else {
      callback(400, { message: err });
    }
  });
};

routeHandler.requestBook = (data, callback) => {
  const { name, username } = data.query;
  fileUtil.read("books", name, (err, bookData) => {
    if (err) {
      callback(400, { message: err.message });
      return;
    }

    if (data.copies === 0) {
      callback(400, {
        message: "Book not available at the moment, check back later",
      });
      return;
    }

    fileUtil.read("users", username, (err, userData) => {
      if (err) {
        callback(400, { message: err.message });
        return;
      }

      const { borrowedBooks } = userData;
      if (borrowedBooks.includes(name)) {
        callback(400, { message: "You have borrowed the book already" });
        return;
      }

      bookData.copies -= 1;
      userData.borrowedBooks.push(bookData.name);

      // update book
      fileUtil.update("books", name, bookData, (err) => {
        if (err) {
          callback(400, { message: err });
          return;
        }

        // update user
        fileUtil.update("user", username, userData, (err) => {
          if (err) {
            callback(400, { message: err });
            return;
          }

          // remove copies from the book info returned to the user
          const { copies: _, ...bookInfo } = bookData;

          callback(200, {
            message: "You borrowed book successfully",
            data: bookInfo,
          });
        });
      });
    });
  });
};

routeHandler.returnBook = (data, callback) => {
  const { name, username } = data.query;
  fileUtil.read("books", name, (err, bookData) => {
    if (err) {
      callback(400, { message: err.message });
      return;
    }

    fileUtil.read("users", username, (err, userData) => {
      if (err) {
        callback(400, { message: err.message });
        return;
      }

      const { borrowedBooks } = userData;
      if (!borrowedBooks.includes(name)) {
        callback(400, { message: "You have not borrowed the book" });
        return;
      }

      bookData.copies += 1;
      const index = userData.borrowedBooks.indexOf(name);
      userData.borrowedBooks.splice(index, 1);

      // update book
      fileUtil.update("books", name, bookData, (err) => {
        if (err) {
          callback(400, { message: err });
          return;
        }

        // update user
        fileUtil.update("user", username, userData, (err) => {
          if (err) {
            callback(400, { message: err });
            return;
          }

          callback(200, {
            message: "You successfully returned book",
          });
        });
      });
    });
  });
};

module.exports = routeHandler;
