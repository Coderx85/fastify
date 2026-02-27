import z from "zod";
import { UserDTO } from "./user.dto";

const AuthUserDTO = z.object({
  user: UserDTO,
  token: z.string(),
});

export interface IAuthUserDTO extends z.infer<typeof AuthUserDTO> {}
