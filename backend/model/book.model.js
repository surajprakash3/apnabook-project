import mongoose from "mongoose";
const bookSchema=mongoose.Schema({
    name:String,
    price:Numnber,
    Category:String,
    images:String,
    title:String
    




})
const Book=mongoose.model("BOOK",bookSchema);
export default Book;

