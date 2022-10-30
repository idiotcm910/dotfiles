!DOCTYPE html>                                                              
    <html>                                                                      
    <body>                                                  
   <?php
       $courses = array(
           [
               'mamon'=>'101',
                'tenmon'=>'Thiết kế web 1'
            ],
            [
               'mamon'=>'201',
             'tenmon'=>'Thiết kế web 2' 
           ],
           [
               'mamon'=>'301',
               'tenmon'=>'SEO' 
           ],
       );
   ?>
    
   <h1>Danh sách môn học</h1>
   <table border="1" width="100%">
       <thead>
           <tr>
                <th>Mã môn</th>
               <th>Tên môn</th>
                <th></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($courses as $course): ?>
                <tr>
                   <td><?php echo $course['mamon']?></td>  
                   <td><?php echo $course['tenmon']?></td> 
                   <td><?php echo '<a href="http://localhost:80/detail-course.php?id='.$course['mamon'].'">Xem chi tiết</a>'?></td>
                </tr>   
            <?php endforeach; ?>                                                                                                                                        
        </tbody>  
            </tbody>                                                                                                                                                        
     </body>
    </html>
