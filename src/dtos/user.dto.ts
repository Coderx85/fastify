import { userSelectScehema } from "@/db/schema";

// DTO (Data Transfer Object) for User to control what data is sent to the client
export const UserDTO = userSelectScehema.pick({
  id: true,
  email: true,
  name: true,
});

export interface IUserDTO extends ReturnType<typeof UserDTO.parse> {}
