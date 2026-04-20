import API from "../api/axios";

/*
REGISTER USER
*/
export const registerUser = async (data: any) => {
  const response = await API.post("/auth/register", data);
  return response.data;
};

/*
LOGIN USER
*/
export const loginUser = async (data: any) => {
  const response = await API.post("/auth/login", data);
  return response.data;
};