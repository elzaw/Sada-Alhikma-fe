import axios from "axios";

const instance = axios.create({
  baseURL: "https://running-antelope-elzaw-25aed18b.koyeb.app/api",
});

export default instance;
