<!DOCTYPE html>                                                              
<html>                                                                       
<body>                                                  
<?php
    $danhsach = array(
        [
            'username'=>'admin',
            'password'=>'123456'
        ],
        [
            'username'=>'sub01',
            'password'=>'123' 
        ],
        [
            'username'=>'sub02',
            'password'=>'456'
        ],
        [
            'username'=>'reviewer',
            'password'=>'556'
        ],
        [
            'username'=>'wirted',
            'password'=>'444'
        ],
    );
	if($_SERVER["REQUEST_METHOD"] == "POST"){
		$username = $_POST['username'];
		$password = $_POST['password'];
		$dangnhapthanhcong = false;
		foreach($danhsach as $user){
			if($username == $user['username'] && $password == $user['password']){
				$dangnhapthanhcong = true;
				break;	
			}
		}
		if($dangnhapthanhcong){
			echo "<script>alert('Chào mừng');</script>";
		}
		else{
			echo "<script>alert('Vui lòng nhập lại');</script>";
		}
	}

		
?>
<form method="post" action="<?php echo $_SERVER['PHP_SELF'];?>">
 	<div> 
		User name <input type="text" name="username">
	</div>
 	<div> 
		Password <input type="text" name="password">
	</div>
	<button action="submit">Đăng nhập</button>

</form>
</body>
</html>
