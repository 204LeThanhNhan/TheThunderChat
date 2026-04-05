import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "../ui/label"
import GoogleSignInButton from "./GoogleSignInButton"
import ForgotPasswordDialog from "./ForgotPasswordDialog"
import {z} from 'zod'; // kiểm tra dữ liệu
import {useForm} from 'react-hook-form'; //xử lý trạng thái, sự kiện form
import {zodResolver} from '@hookform/resolvers/zod';
import { useAuthStore } from "@/stores/useAuthStore"
import { useNavigate } from "react-router"


const signInSchema = z.object({
  username: z.string().min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
});

type SignInFormValues = z.infer<typeof signInSchema>

export function SignInForm({className,...props}: React.ComponentProps<"div">){
    const {signIn} = useAuthStore();
    const navigate = useNavigate();
    /*handleSubmit chạy khi người dùng bấm đăng ký*/
  const {register, handleSubmit, formState: {errors, isSubmitting}}= useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema)
  });

  const onSubmit = async (data: SignInFormValues) => {
    //gọi backend để sign in
    const {username, password} = data;
    await signIn(username, password);
    navigate("/");
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p- border-border">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">

              {/* header + logo*/}
                <div className="flex flex-col items-center text-center gap-2">
                  <a href="/" className="mx-auto block w-fit text-center">
                    <img src="/logo.svg" alt="Thunder Chat" className="w-[50px] h-[50px]" />
                  </a>  

                  <h1 className="text-2xl font-bold">Chào mừng bạn trở lại</h1>
                  <p className="text-muted-foreground text-balance">
                    Đăng nhập tài khoản Thunder Chat của bạn
                  </p>
                </div>

              {/* username*/}
                <div className="flex flex-col gap-3">
                  <Label htmlFor="username" className="block text-sm">
                    Tên đăng nhập
                  </Label>
                  <Input type="text" id="username" placeholder="thunderuser"
                  {...register("username")}
                  />
                    {
                      /* chỗ này hiển thị lỗi */
                      errors.username && (
                        <p className="text-sm text-destructive">
                          {errors.username.message}
                        </p>
                      )
                    }
                </div>

              {/* password */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="block text-sm">
                      Mật khẩu
                    </Label>
                    <ForgotPasswordDialog />
                  </div>
                  <Input type="password" id="password"
                  {...register("password")}
                  />
                    {
                      /* chỗ này hiển thị lỗi */
                      errors.password && (
                        <p className="text-sm text-destructive">
                          {errors.password.message}
                        </p>
                      )
                    }
                </div>

              {/* nút đăng nhập */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                Đăng nhập
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Hoặc</span>
                </div>
              </div>

              <GoogleSignInButton />

              <div className="text-center text-sm">Bạn chưa có tài khoản? {" "} <a href="/signup" className="underline underline-offset-4">Đăng ký ngay</a></div>
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src="/placeholder.png"
              alt="Image"
              className="absolute top-1/2 -translate-y-1/2 object-cover"
            />
          </div>
        </CardContent>
      </Card>
      <div className=" text-xs text-balance px-6 text-center *:[a]:hover:text-primary text-muted-foreground
                                        *:[a]:underline *:[a]:underline-offset-4"
      /*tất cả thẻ a trong div hover vào thì đổi màu primary */>

        Bằng cách tiếp tục, bạn đồng ý với <a href="#">Điều khoản dịch vụ</a>{" "}
        và <a href="#">Chính sách bảo mật</a> của chúng tôi.

      </div>
    </div>
  )
}