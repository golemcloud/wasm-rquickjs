fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.get(1).is_some_and(|arg| arg == "fixtures") {
        println!("{}", process_boundary_no_fork::fixtures());
        return;
    }
    futures::executor::block_on(async {
        if args.get(1).is_some_and(|arg| arg == "complete") {
            for case in 0..process_boundary_no_fork::COMPLETION_CASE_COUNT {
                println!("{}", process_boundary_no_fork::complete(case).await);
            }
        } else if args.get(1).is_some_and(|arg| arg == "bench") {
            let repetitions: u32 = args.get(2).map_or(11, |arg| arg.parse().unwrap());
            let multiplier: u32 = args.get(3).map_or(1, |arg| arg.parse().unwrap());
            assert!(repetitions > 0 && multiplier > 0);
            for repetition in 0..repetitions {
                for workload in 0..4 {
                    let size = [2_000_000, 20_000, 4_000, 4_000][workload as usize]
                        * if workload == 0 { 1 } else { multiplier };
                    for order in 0..3 {
                        let variant = (order + repetition) % 3;
                        println!(
                            "{}",
                            process_boundary_no_fork::benchmark(workload, variant, size).await
                        );
                    }
                }
            }
        } else {
            for case in 0..process_boundary_no_fork::CASE_COUNT {
                println!("{}", process_boundary_no_fork::run(case, true).await);
            }
            for case in [9, 19, 20] {
                println!("{}", process_boundary_no_fork::run(case, false).await);
            }
        }
    });
}
